'use client';

interface DexIntegration {
  name: string;
  type: 'DEX' | 'Wallet' | 'CEX';
  image: string;
  status: 'active' | 'coming-soon';
  description: string;
}

const integrations: DexIntegration[] = [
  {
    name: 'Jupiter',
    type: 'DEX',
    image: '/images/jupiter.jpg',
    status: 'active',
    description: 'Multi-DEX aggregator for optimal routing',
  },
  {
    name: 'Raydium',
    type: 'DEX',
    image: '/images/radiyum.jpg',
    status: 'active',
    description: 'Automated market maker on Solana',
  },
  {
    name: 'Binance',
    type: 'CEX',
    image: '/images/binance.jpg',
    status: 'coming-soon',
    description: 'Centralized exchange integration',
  },
  {
    name: 'Backpack',
    type: 'Wallet',
    image: '/images/backpack.jpg',
    status: 'active',
    description: 'Solana wallet for secure transactions',
  },
];

export function DexIntegrations() {
  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Multi-DEX & Wallet Integrations</h2>
          <p className="text-sm text-gray-600 mt-1">
            Seamless trading across multiple exchanges and wallets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className={`relative glass-card rounded-xl p-4 transition-all ${
              integration.status === 'active'
                ? 'border-green-300/50'
                : 'opacity-75'
            }`}
          >
            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              {integration.status === 'active' ? (
                <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-400 text-white text-xs font-medium rounded-full">
                  Coming Soon
                </span>
              )}
            </div>

            {/* Logo */}
            <div className="flex items-center justify-center mb-3 h-16">
              <img
                src={integration.image}
                alt={integration.name}
                className="object-contain max-h-16 max-w-16"
              />
            </div>

            {/* Name and Type */}
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-1">{integration.name}</h3>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                  integration.type === 'DEX'
                    ? 'bg-blue-100 text-blue-800'
                    : integration.type === 'Wallet'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {integration.type}
              </span>
              <p className="text-xs text-gray-600 mt-2">{integration.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Features List */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Key Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Automated route optimization</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Slippage protection</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Multi-wallet support</span>
          </div>
        </div>
      </div>
    </div>
  );
}

