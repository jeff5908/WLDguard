export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-300 py-12 px-6 sm:px-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy for WLDguard</h1>
        <p className="text-sm text-slate-500 italic">Last Updated: October 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">1. Data Collection & Usage</h2>
          <p>
            WLDguard Software LLC prioritizes user privacy through our non-custodial architecture. Because WLDguard operates entirely on-chain via the World App MiniKit, we do not require you to create an account, provide a name, or submit traditional Personally Identifiable Information (PII).
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We only log non-identifiable on-chain data necessary for the software's intent relayer to function (e.g., public wallet addresses, transaction hashes, and timestamped intents).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">2. World ID and Biometric Data Integration</h2>
          <p>
            WLDguard Software LLC utilizes the World App MiniKit and World ID exclusively for sybil-resistance and intent authorization. WLDguard receives only Zero-Knowledge (ZK) cryptographic proofs to verify human uniqueness. <strong>At no point does WLDguard access, process, transmit, or store any user biometric data, iris scans, or personal identifying information.</strong> All biometric verification is handled strictly by the Worldcoin Foundation's secure hardware and protocols.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">3. Third-Party Protocols</h2>
          <p>
            WLDguard interfaces with decentralized protocols on World Chain (including, but not limited to, Morpho Vaults). By authorizing transactions, you agree to the privacy and data practices inherent to public blockchain networks, where transaction histories are immutable and publicly visible.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">4. Contact</h2>
          <p>
            For technical support or inquiries regarding data privacy, please contact: <a href="mailto:WLDguard.support@gmail.com" className="text-blue-400 hover:text-blue-300">WLDguard.support@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  );
}
