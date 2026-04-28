/**
 * SemaphoreContext — Zero-Knowledge Proof (ZKP) Layer
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Implements Semaphore V4 protocol:
 * 1. Create a Semaphore identity (deterministically from wallet signature)
 * 2. Build an in-memory group with demo members
 * 3. Generate a ZKP proof that "I am a member of this group"
 *    WITHOUT revealing WHICH member I am
 * 4. Verify the proof locally
 *
 * Key property: The proof reveals NOTHING about the user's identity.
 * The nullifier prevents double-signaling without linking to identity.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof, verifyProof } from '@semaphore-protocol/proof';
import type { SemaphoreProof } from '@semaphore-protocol/proof';

export type ZKPStatus = 'idle' | 'creating-identity' | 'building-group' | 'generating-proof' | 'verifying' | 'verified' | 'failed';

export interface SemaphoreIdentityInfo {
  commitment: string;   // Public commitment (safe to share)
  // Private key is NEVER exposed — stays inside Identity object
}

export interface ZKPProofResult {
  proof: SemaphoreProof;
  merkleTreeDepth: number;
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
  isValid: boolean;
  generatedAt: number;
}

interface SemaphoreContextType {
  status: ZKPStatus;
  identityInfo: SemaphoreIdentityInfo | null;
  proofResult: ZKPProofResult | null;
  groupSize: number;
  memberIndex: number | null;
  error: string | null;
  createIdentityFromWallet: (walletSignature: string) => Promise<void>;
  generateGroupProof: (message: string) => Promise<void>;
  resetProof: () => void;
}

const SemaphoreContext = createContext<SemaphoreContextType | null>(null);

// Demo group size — in production this would be fetched from on-chain
const DEMO_GROUP_SIZE = 10;
const DEMO_SCOPE = 'privacy-mvp-demo-v1';

export function SemaphoreProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ZKPStatus>('idle');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identityInfo, setIdentityInfo] = useState<SemaphoreIdentityInfo | null>(null);
  const [proofResult, setProofResult] = useState<ZKPProofResult | null>(null);
  const [memberIndex, setMemberIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createIdentityFromWallet = useCallback(async (walletSignature: string) => {
    setError(null);
    setStatus('creating-identity');

    try {
      // Derive Semaphore identity deterministically from wallet signature
      // The identity's private key is derived from the signature — same wallet = same identity
      // This is the standard pattern: sign a fixed message, use signature as seed
      const id = new Identity(walletSignature);

      setIdentity(id);
      setIdentityInfo({
        commitment: id.commitment.toString(),
      });
      setStatus('idle');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create Semaphore identity';
      setError(msg);
      setStatus('failed');
    }
  }, []);

  const generateGroupProof = useCallback(async (message: string) => {
    if (!identity) {
      setError('No Semaphore identity. Please connect wallet first.');
      return;
    }

    setError(null);
    setStatus('building-group');

    try {
      // Build a demo group with the user's commitment + dummy members
      // In production: fetch real group members from on-chain Semaphore contract
      const group = new Group();
      
      // Add dummy members to simulate a real group
      for (let i = 0; i < DEMO_GROUP_SIZE - 1; i++) {
        // Generate deterministic dummy commitments for demo
        const dummyId = new Identity(`demo-member-${i}-seed`);
        group.addMember(dummyId.commitment);
      }

      // Add our real identity — remember the index
      group.addMember(identity.commitment);
      const myIndex = group.members.length - 1;
      setMemberIndex(myIndex);

      setStatus('generating-proof');

      // Generate the ZKP proof
      // This proves: "I know a private key whose commitment is in this group"
      // WITHOUT revealing which commitment is mine
      const proof = await generateProof(identity, group, message, DEMO_SCOPE);

      setStatus('verifying');

      // Verify the proof locally
      const isValid = await verifyProof(proof);

      const result: ZKPProofResult = {
        proof,
        merkleTreeDepth: proof.merkleTreeDepth,
        merkleTreeRoot: proof.merkleTreeRoot.toString(),
        nullifier: proof.nullifier.toString(),
        message: proof.message.toString(),
        scope: proof.scope.toString(),
        isValid,
        generatedAt: Date.now(),
      };

      setProofResult(result);
      setStatus('verified');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ZKP proof generation failed';
      setError(msg);
      setStatus('failed');
    }
  }, [identity]);

  const resetProof = useCallback(() => {
    setProofResult(null);
    setStatus('idle');
    setError(null);
  }, []);

  return (
    <SemaphoreContext.Provider value={{
      status,
      identityInfo,
      proofResult,
      groupSize: DEMO_GROUP_SIZE,
      memberIndex,
      error,
      createIdentityFromWallet,
      generateGroupProof,
      resetProof,
    }}>
      {children}
    </SemaphoreContext.Provider>
  );
}

export function useSemaphore() {
  const ctx = useContext(SemaphoreContext);
  if (!ctx) throw new Error('useSemaphore must be used within SemaphoreProvider');
  return ctx;
}
