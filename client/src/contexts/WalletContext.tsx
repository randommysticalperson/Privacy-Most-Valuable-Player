/**
 * WalletContext — MetaMask + Burner Wallet authentication
 *
 * Wallet types:
 *   "metamask" — connects via window.ethereum (MetaMask Extension / compatible)
 *   "burner"   — ephemeral keypair generated in-browser via ethers.js,
 *                private key AES-GCM encrypted and stored in localStorage.
 *                Zero server involvement; burn at any time.
 *
 * Exports drop-in hook replacements for the @web3auth/modal hooks:
 *   useWeb3AuthConnect    → wraps connect()
 *   useWeb3AuthDisconnect → wraps disconnect()
 *   useWeb3AuthUser       → returns { userInfo, isConnected }
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Wallet as EthersWallet, HDNodeWallet } from 'ethers';
import { toast } from 'sonner';

// ─── Window type augmentation ─────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type WalletType = 'metamask' | 'burner' | null;

export interface WalletUser {
  address: string;
  /** Pseudonymous alias derived deterministically from address */
  name: string;
  /** Kept for API compat — always undefined for native wallet */
  email: string | undefined;
  alias: string;
  /** W3C DID:PKH identifier */
  did: string;
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  /** Which wallet type is currently active */
  walletType: WalletType;
  address: string | null;
  userInfo: WalletUser | null;
  hasProvider: boolean;
  /** Sign an arbitrary message (works for both MetaMask and burner) */
  signMessage: (message: string) => Promise<string>;
  /** Connect via MetaMask / EIP-1193 provider */
  connect: () => Promise<void>;
  /** Disconnect (burner: also burns the key) */
  disconnect: () => void;
  /** Generate a new ephemeral burner keypair and connect with it */
  createBurner: () => Promise<void>;
  /** Wipe the burner private key from localStorage and disconnect */
  burnWallet: () => void;
}

// ─── Alias helpers ────────────────────────────────────────────────────────────

const ADJECTIVES = [
  'silent', 'cipher', 'ghost', 'null', 'masked', 'veiled',
  'phantom', 'anon', 'shadow', 'hidden', 'zero', 'dark',
  'mute', 'blind', 'void', 'stealth',
];
const NOUNS = [
  'node', 'proof', 'hash', 'byte', 'signal', 'vector',
  'key', 'nonce', 'salt', 'shard', 'leaf', 'root',
  'gate', 'mask', 'ring', 'chain',
];

function deriveAlias(address: string): string {
  const lower = address.toLowerCase();
  const a = parseInt(lower.slice(2, 6), 16) % ADJECTIVES.length;
  const b = parseInt(lower.slice(6, 10), 16) % NOUNS.length;
  const hex = lower.slice(-3);
  return `${ADJECTIVES[a]}-${NOUNS[b]}-${hex}`;
}

function buildUser(address: string): WalletUser {
  const alias = deriveAlias(address);
  return {
    address,
    name: alias,
    email: undefined,
    alias,
    did: `did:pkh:eip155:1:${address.toLowerCase()}`,
  };
}

// ─── Burner key encryption helpers (AES-GCM via WebCrypto) ───────────────────

const BURNER_KEY_LS  = 'zf_burner_enc';
const BURNER_SALT_LS = 'zf_burner_salt';
const WALLET_ADDR_LS = 'zf_wallet_address';
const WALLET_TYPE_LS = 'zf_wallet_type';

/** Derive an AES-GCM CryptoKey from a random salt stored in localStorage. */
async function deriveAesKey(salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', salt, 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptPrivateKey(privateKey: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
  const iv   = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const key  = await deriveAesKey(salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(privateKey)
  );
  localStorage.setItem(BURNER_SALT_LS, btoa(String.fromCharCode(...salt)));
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decryptPrivateKey(blob: string): Promise<string | null> {
  try {
    const saltB64 = localStorage.getItem(BURNER_SALT_LS);
    if (!saltB64) return null;
    const salt     = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
    const key      = await deriveAesKey(salt);
    const combined = Uint8Array.from(atob(blob), c => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
    const iv         = combined.slice(0, 12) as Uint8Array<ArrayBuffer>;
    const ciphertext = combined.slice(12) as Uint8Array<ArrayBuffer>;
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

function clearBurnerStorage() {
  localStorage.removeItem(BURNER_KEY_LS);
  localStorage.removeItem(BURNER_SALT_LS);
  localStorage.removeItem(WALLET_ADDR_LS);
  localStorage.removeItem(WALLET_TYPE_LS);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address,      setAddress]      = useState<string | null>(null);
  const [walletType,   setWalletType]   = useState<WalletType>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [burnerWallet, setBurnerWallet] = useState<EthersWallet | HDNodeWallet | null>(null);

  const hasProvider =
    typeof window !== 'undefined' && Boolean(window.ethereum);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const savedType = localStorage.getItem(WALLET_TYPE_LS) as WalletType;
    const savedAddr = localStorage.getItem(WALLET_ADDR_LS);

    if (savedType === 'metamask' && savedAddr) {
      if (window.ethereum) {
        window.ethereum
          .request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.map((a: string) => a.toLowerCase()).includes(savedAddr.toLowerCase())) {
              setAddress(savedAddr);
              setWalletType('metamask');
            } else {
              localStorage.removeItem(WALLET_ADDR_LS);
              localStorage.removeItem(WALLET_TYPE_LS);
            }
          })
          .catch(() => { /* ignore */ });
      }
    } else if (savedType === 'burner' && savedAddr) {
      const blob = localStorage.getItem(BURNER_KEY_LS);
      if (blob) {
        decryptPrivateKey(blob).then(pk => {
          if (pk) {
            const w = new EthersWallet(pk);
            setBurnerWallet(w);
            setAddress(savedAddr);
            setWalletType('burner');
          } else {
            clearBurnerStorage();
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── MetaMask event listeners ──────────────────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts: string[]) => {
      if (walletType !== 'metamask') return;
      if (accounts.length === 0) {
        setAddress(null);
        setWalletType(null);
        localStorage.removeItem(WALLET_ADDR_LS);
        localStorage.removeItem(WALLET_TYPE_LS);
      } else {
        setAddress(accounts[0]);
        localStorage.setItem(WALLET_ADDR_LS, accounts[0]);
      }
    };
    window.ethereum.on('accountsChanged', handleAccounts);
    return () => window.ethereum?.removeListener('accountsChanged', handleAccounts);
  }, [walletType]);

  // ── MetaMask connect ──────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('No wallet detected', {
        description: 'Install MetaMask at metamask.io, or use a Burner Wallet below.',
        duration: 6000,
      });
      return;
    }
    setIsConnecting(true);
    try {
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts.length > 0) {
        const addr = accounts[0];
        setAddress(addr);
        setWalletType('metamask');
        setBurnerWallet(null);
        localStorage.setItem(WALLET_ADDR_LS, addr);
        localStorage.setItem(WALLET_TYPE_LS, 'metamask');
        localStorage.removeItem(BURNER_KEY_LS);
        localStorage.removeItem(BURNER_SALT_LS);
        const alias = deriveAlias(addr);
        toast.success(`Connected as ${alias}`, {
          description: `DID: did:pkh:eip155:1:${addr.toLowerCase().slice(0, 10)}…`,
        });
      }
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      if (e?.code === 4001) {
        toast.error('Connection rejected');
      } else {
        toast.error('Failed to connect wallet', { description: e?.message });
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Burner wallet create ──────────────────────────────────────────────────
  const createBurner = useCallback(async () => {
    setIsConnecting(true);
    try {
      const w    = EthersWallet.createRandom();
      const addr = w.address;
      const blob = await encryptPrivateKey(w.privateKey);
      localStorage.setItem(BURNER_KEY_LS,  blob);
      localStorage.setItem(WALLET_ADDR_LS, addr);
      localStorage.setItem(WALLET_TYPE_LS, 'burner');
      setBurnerWallet(w);
      setAddress(addr);
      setWalletType('burner');
      const alias = deriveAlias(addr);
      toast.success(`Burner wallet created: ${alias}`, {
        description: 'This wallet exists only in your browser. Burn it when done.',
        duration: 6000,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error('Failed to create burner wallet', { description: e?.message });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Burn wallet ───────────────────────────────────────────────────────────
  const burnWallet = useCallback(() => {
    clearBurnerStorage();
    setBurnerWallet(null);
    setAddress(null);
    setWalletType(null);
    toast.info('Burner wallet destroyed', {
      description: 'The private key has been wiped from your browser.',
    });
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (walletType === 'burner') {
      burnWallet();
      return;
    }
    setAddress(null);
    setWalletType(null);
    localStorage.removeItem(WALLET_ADDR_LS);
    localStorage.removeItem(WALLET_TYPE_LS);
    toast.info('Wallet disconnected');
  }, [walletType, burnWallet]);

  // ── Sign message ──────────────────────────────────────────────────────────
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (walletType === 'burner' && burnerWallet) {
        // Both Wallet and HDNodeWallet have signMessage
        return (burnerWallet as EthersWallet).signMessage(message);
      }
      if (walletType === 'metamask' && window.ethereum && address) {
        return window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });
      }
      throw new Error('No wallet connected');
    },
    [walletType, burnerWallet, address]
  );

  const userInfo = address ? buildUser(address) : null;

  return (
    <WalletContext.Provider
      value={{
        isConnected: Boolean(address),
        isConnecting,
        walletType,
        address,
        userInfo,
        hasProvider,
        signMessage,
        connect,
        disconnect,
        createBurner,
        burnWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}

/** Drop-in replacement for useWeb3AuthConnect from @web3auth/modal/react */
export function useWeb3AuthConnect() {
  const { connect, isConnecting } = useWallet();
  return { connect, isConnecting };
}

/** Drop-in replacement for useWeb3AuthDisconnect from @web3auth/modal/react */
export function useWeb3AuthDisconnect() {
  const { disconnect } = useWallet();
  return { disconnect };
}

/** Drop-in replacement for useWeb3AuthUser from @web3auth/modal/react */
export function useWeb3AuthUser() {
  const { userInfo, isConnected } = useWallet();
  return { userInfo, isConnected };
}
