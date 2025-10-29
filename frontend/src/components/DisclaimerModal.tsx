'use client';

import { useState, useEffect } from 'react';

export function DisclaimerModal() {
  const [show, setShow] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const hasAcknowledged = localStorage.getItem('disclaimer_acknowledged');
    if (!hasAcknowledged) {
      setShow(true);
    }
  }, []);

  const handleAcknowledge = () => {
    if (acknowledged) {
      localStorage.setItem('disclaimer_acknowledged', 'true');
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600">IMPORTANT DISCLAIMER</h2>
          </div>

          <div className="space-y-4 text-gray-700">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="font-bold text-red-800">FOR EDUCATIONAL PURPOSES ONLY</p>
              <p className="text-sm mt-1">
                This platform is designed for educational and demonstration purposes only. It is NOT intended for real trading with actual funds.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-lg">Key Warnings:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>
                  <strong>High Risk:</strong> Cryptocurrency trading involves substantial risk of loss. You can lose all of your invested capital.
                </li>
                <li>
                  <strong>No Guarantees:</strong> Past performance does not guarantee future results. AI-generated signals are not financial advice.
                </li>
                <li>
                  <strong>Use Testnet:</strong> We strongly recommend using Solana Devnet for testing. Never use mainnet with funds you cannot afford to lose.
                </li>
                <li>
                  <strong>Not Financial Advice:</strong> This platform does not provide financial, investment, or trading advice. Consult a licensed financial advisor.
                </li>
                <li>
                  <strong>Experimental Technology:</strong> This platform uses experimental AI and blockchain technology that may contain bugs or errors.
                </li>
                <li>
                  <strong>No Liability:</strong> The creators and operators of this platform accept no liability for any losses incurred through its use.
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="font-bold text-blue-800">Recommended Setup:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>✓ Use Solana Devnet (not Mainnet)</li>
                <li>✓ Test with small amounts only</li>
                <li>✓ Understand the risks before trading</li>
                <li>✓ Never invest more than you can afford to lose</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <p className="font-bold text-yellow-800">Legal Notice:</p>
              <p className="text-sm mt-1">
                By using this platform, you acknowledge that you understand the risks involved in cryptocurrency trading and that you are solely responsible for your trading decisions and any resulting losses.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 w-5 h-5"
              />
              <span className="text-sm">
                I have read and understood the above warnings. I acknowledge that this platform is for educational purposes only and that I am solely responsible for any trading decisions I make.
              </span>
            </label>

            <button
              onClick={handleAcknowledge}
              disabled={!acknowledged}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              I Understand and Accept the Risks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
