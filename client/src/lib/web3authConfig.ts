/**
 * web3authConfig.ts — MetaMask Embedded Wallets SDK Configuration
 * Uses @web3auth/modal (Web3Auth PnP Modal) as the MetaMask Embedded Wallets SDK
 *
 * Note: A real deployment requires a Client ID from https://dashboard.web3auth.io
 * For this demo we use SAPPHIRE_DEVNET which works without a dashboard account.
 * The modal will show social logins + MetaMask + WalletConnect options.
 */

import { type Web3AuthContextConfig } from '@web3auth/modal/react';
import { WEB3AUTH_NETWORK, type Web3AuthOptions } from '@web3auth/modal';

// Demo client ID — replace with your own from https://dashboard.web3auth.io
// for production use. This is the Web3Auth demo client ID for devnet.
const CLIENT_ID = 'BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIJLLBjg';

const web3AuthOptions: Web3AuthOptions = {
  clientId: CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  // Customize the modal appearance to match our dark space theme
  uiConfig: {
    appName: 'ZeroForum',
    appUrl: window.location.origin,
    theme: {
      primary: '#6366f1', // indigo to match our glassmorphism palette
    },
    mode: 'dark',
    logoLight: 'https://web3auth.io/images/web3authlog.png',
    logoDark: 'https://web3auth.io/images/web3authlogodark.png',
    defaultLanguage: 'en',
    loginGridCol: 3,
    primaryButton: 'externalLogin',
  },
};

export const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions,
};
