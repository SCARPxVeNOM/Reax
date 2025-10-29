'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

interface WalletState {
  connected: boolean;
  address: string | null;
  publicKey: PublicKey | null;
}

export function WalletConnect() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    publicKey: null,
  });

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const { solana } = window as any;
      if (solana?.isPhantom) {
        const response = await solana.connect({ onlyIfTrusted: true });
        setWallet({
          connected: true,
          address: response.publicKey.toString(),
          publicKey: response.publicKey,
        });
      }
    } catch (error) {
      console.log('Wallet not connected');
    }
  };

  const connectWallet = async () => {
    try {
      const { solana } = window as any;
      if (!solana) {
        alert('Please install Phantom wallet');
        window.open('https://phantom.app/', '_blank');
        return;
      }

      const response = await solana.connect();
      setWallet({
        connected: true,
        address: response.publicKey.toString(),
        publicKey: response.publicKey,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    try {
      const { solana } = window as any;
      if (solana) {
        await solana.disconnect();
        setWallet({
          connected: false,
          address: null,
          publicKey: null,
        });
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (wallet.connected && wallet.address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-mono text-sm">
          {formatAddress(wallet.address)}
        </div>
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
    >
      Connect Wallet
    </button>
  );
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    publicKey: null,
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { solana } = window as any;
        if (solana?.isPhantom) {
          const response = await solana.connect({ onlyIfTrusted: true });
          setWallet({
            connected: true,
            address: response.publicKey.toString(),
            publicKey: response.publicKey,
          });
        }
      } catch (error) {
        // Not connected
      }
    };

    checkConnection();

    // Listen for wallet events
    const { solana } = window as any;
    if (solana) {
      solana.on('connect', (publicKey: PublicKey) => {
        setWallet({
          connected: true,
          address: publicKey.toString(),
          publicKey,
        });
      });

      solana.on('disconnect', () => {
        setWallet({
          connected: false,
          address: null,
          publicKey: null,
        });
      });
    }
  }, []);

  const signMessage = async (message: string): Promise<string | null> => {
    try {
      const { solana } = window as any;
      if (!solana || !wallet.connected) {
        throw new Error('Wallet not connected');
      }

      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await solana.signMessage(encodedMessage, 'utf8');
      return Buffer.from(signedMessage.signature).toString('hex');
    } catch (error) {
      console.error('Error signing message:', error);
      return null;
    }
  };

  return {
    ...wallet,
    signMessage,
  };
}
