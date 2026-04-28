/**
 * WalletContext — DID/Wallet Authentication Layer
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Implements Sign-In with Ethereum (SIWE) pattern:
 * 1. Connect wallet (MetaMask / injected provider)
 * 2. Sign a challenge message to prove ownership of the address
 * 3. Derive a DID:pkh from the Ethereum address (did:pkh:eip155:1:<address>)
 * 4. Store session in memory only — no server, no cookies, no passwords
 *
 * No username/password. Identity = cryptographic key pair.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

// Extend window type for MetaMask/injected provider
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

export type WalletStatus = 'disconnected' | 'connecting' | 'signing' | 'connected' | 'error';

export interface WalletSession {
  address: string;
  did: string;          // did:pkh:eip155:1:<address>
  chainId: number;
  balance: string;
  signedAt: number;
  signature: string;
  message: string;
}

interface WalletContextType {
  status: WalletStatus;
  session: WalletSession | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

function buildSIWEMessage(address: string, chainId: number, nonce: string): string {
  const domain = window.location.host;
  const origin = window.location.origin;
  const issuedAt = new Date().toISOString();
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in to Privacy-First Identity MVP',
    '',
    `URI: ${origin}`,
    `Version: 1`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Statement: I agree to authenticate without revealing my identity. No password required.`,
  ].join('\n');
}

function generateNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [session, setSession] = useState<WalletSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Detect existing MetaMask connection on mount
  useEffect(() => {
    const checkExisting = async () => {
      if (!window.ethereum) return;
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          // Don't auto-reconnect — require explicit sign-in for security
        }
      } catch {
        // Silently ignore
      }
    };
    checkExisting();
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus('connecting');

    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      const provider = new BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const balanceBN = await provider.getBalance(address);
      const balance = formatEther(balanceBN);

      // Build SIWE-style challenge message
      const nonce = generateNonce();
      const message = buildSIWEMessage(address, chainId, nonce);

      setStatus('signing');

      // Sign the challenge — proves ownership without revealing private key
      const signature = await signer.signMessage(message);

      // Derive DID:pkh identifier (W3C DID standard)
      const did = `did:pkh:eip155:${chainId}:${address}`;

      const newSession: WalletSession = {
        address,
        did,
        chainId,
        balance: parseFloat(balance).toFixed(4),
        signedAt: Date.now(),
        signature,
        message,
      };

      setSession(newSession);
      setStatus('connected');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error during wallet connection';
      setError(msg.includes('user rejected') ? 'Signature rejected by user.' : msg);
      setStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    setSession(null);
    setStatus('disconnected');
    setError(null);
  }, []);

  return (
    <WalletContext.Provider value={{
      status,
      session,
      error,
      connect,
      disconnect,
      isConnected: status === 'connected' && session !== null,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
