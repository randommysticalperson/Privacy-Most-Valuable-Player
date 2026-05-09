/**
 * WalletContext — Native MetaMask / EIP-1193 Wallet Context
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Uses window.ethereum (MetaMask, Brave Wallet, Coinbase Wallet, etc.)
 * directly via EIP-1193 — zero external cloud services or API keys required.
 *
 * Exports drop-in hook replacements for the @web3auth/modal hooks:
 *   useWeb3AuthConnect    → wraps connect()
 *   useWeb3AuthDisconnect → wraps disconnect()
 *   useWeb3AuthUser       → returns { userInfo, isConnected }
 *
 * Also exports useWallet() for full state access.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

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
  address: string | null;
  userInfo: WalletUser | null;
  hasProvider: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Context ──────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(() =>
    localStorage.getItem('zf_wallet_address')
  );
  const [isConnecting, setIsConnecting] = useState(false);

  const hasProvider =
    typeof window !== 'undefined' && Boolean(window.ethereum);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        localStorage.removeItem('zf_wallet_address');
      } else {
        setAddress(accounts[0]);
        localStorage.setItem('zf_wallet_address', accounts[0]);
      }
    };
    window.ethereum.on('accountsChanged', handleAccounts);
    return () => window.ethereum?.removeListener('accountsChanged', handleAccounts);
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('No wallet detected', {
        description: 'Install MetaMask at metamask.io to connect.',
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
        setAddress(accounts[0]);
        localStorage.setItem('zf_wallet_address', accounts[0]);
        const alias = deriveAlias(accounts[0]);
        toast.success(`Connected as ${alias}`, {
          description: `DID: did:pkh:eip155:1:${accounts[0].toLowerCase().slice(0, 10)}…`,
        });
      }
    } catch (err: any) {
      if (err?.code === 4001) {
        toast.error('Connection rejected');
      } else {
        toast.error('Failed to connect wallet', { description: err?.message });
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem('zf_wallet_address');
    toast.info('Wallet disconnected');
  }, []);

  const userInfo = address ? buildUser(address) : null;

  return (
    <WalletContext.Provider
      value={{
        isConnected: Boolean(address),
        isConnecting,
        address,
        userInfo,
        hasProvider,
        connect,
        disconnect,
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
