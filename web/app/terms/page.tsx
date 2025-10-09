const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service & Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: October 8, 2025</p>

        {/* Terms of Service */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h3>
              <p className="text-gray-700">
                By using LLMBox ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">2. Description of Service</h3>
              <p className="text-gray-700 mb-2">
                LLMBox is an email-to-AI chat service that allows you to interact with Large Language Models (LLMs) via email. The Service:
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Accepts emails sent to our service address</li>
                <li>Processes your messages using OpenAI's GPT models</li>
                <li>Sends AI-generated responses back to your email address</li>
                <li>Tracks usage based on API costs</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">3. User Accounts and Billing</h3>
              <p className="text-gray-700 mb-2">
                <strong>Free Tier:</strong> Users can use up to $1 in API credits without payment. After reaching this limit, users must upgrade to continue using the Service.
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Paid Plans:</strong> Subscriptions are billed monthly through Stripe. By subscribing, you authorize us to charge your payment method on a recurring basis.
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Credits reset at the start of each billing period</li>
                <li>Unused credits do not roll over</li>
                <li>You may cancel your subscription at any time</li>
                <li>Refunds are not provided for partial months</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">4. Acceptable Use</h3>
              <p className="text-gray-700 mb-2">You agree NOT to use the Service to:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Generate illegal, harmful, or abusive content</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Spam or abuse the Service</li>
                <li>Attempt to circumvent usage limits or billing</li>
                <li>Use the Service for any automated or high-volume purposes without prior written consent</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">5. Content and Intellectual Property</h3>
              <p className="text-gray-700 mb-2">
                <strong>Your Content:</strong> You retain ownership of the content you submit to the Service. By using the Service, you grant us a license to process and respond to your content.
              </p>
              <p className="text-gray-700 mb-2">
                <strong>AI-Generated Content:</strong> AI-generated responses are provided "as-is". We make no warranties about their accuracy, completeness, or reliability.
              </p>
              <p className="text-gray-700">
                <strong>Service Content:</strong> The Service itself, including all code, design, and branding, is owned by LLMBox and protected by copyright law.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">6. Disclaimers and Limitations of Liability</h3>
              <p className="text-gray-700 mb-2">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
              </p>
              <p className="text-gray-700 mb-2">
                We do not guarantee that:
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>The Service will be uninterrupted or error-free</li>
                <li>AI responses will be accurate or appropriate for your needs</li>
                <li>Any errors will be corrected</li>
                <li>The Service will meet your specific requirements</li>
              </ul>
              <p className="text-gray-700 mt-2">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">7. Termination</h3>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for any reason, including violation of these Terms.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">8. Changes to Terms</h3>
              <p className="text-gray-700">
                We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Policy */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">1. Information We Collect</h3>
              <p className="text-gray-700 mb-2">We collect the following information:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li><strong>Email Address:</strong> Used to identify you and send responses</li>
                <li><strong>Email Content:</strong> Your messages sent to the Service</li>
                <li><strong>Usage Data:</strong> Token counts, costs, and timestamps</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store credit card details)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">2. How We Use Your Information</h3>
              <p className="text-gray-700 mb-2">We use your information to:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Provide and improve the Service</li>
                <li>Process your emails through AI models</li>
                <li>Track usage and enforce billing limits</li>
                <li>Send service-related notifications</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">3. Data Sharing and Third Parties</h3>
              <p className="text-gray-700 mb-2">We share data with:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li><strong>OpenAI:</strong> Your email content is sent to OpenAI for processing. See OpenAI's privacy policy at https://openai.com/privacy</li>
                <li><strong>Stripe:</strong> Payment processing. See Stripe's privacy policy at https://stripe.com/privacy</li>
                <li><strong>Supabase:</strong> Data storage and hosting</li>
                <li><strong>SendGrid:</strong> Email delivery</li>
              </ul>
              <p className="text-gray-700 mt-2">
                We do not sell your personal information to third parties.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">4. Data Retention</h3>
              <p className="text-gray-700">
                We retain usage logs and email metadata for billing and service improvement purposes. Email content is not permanently stored beyond processing. You may request deletion of your data by contacting us.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">5. Security</h3>
              <p className="text-gray-700">
                We implement reasonable security measures to protect your data. However, no method of transmission over the Internet is 100% secure. Use the Service at your own risk.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">6. Your Rights</h3>
              <p className="text-gray-700 mb-2">Depending on your jurisdiction, you may have rights to:</p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict processing</li>
                <li>Data portability</li>
              </ul>
              <p className="text-gray-700 mt-2">
                To exercise these rights, contact us at privacy@llmbox.ai
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">7. Children's Privacy</h3>
              <p className="text-gray-700">
                The Service is not intended for children under 13. We do not knowingly collect information from children under 13.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">8. International Users</h3>
              <p className="text-gray-700">
                Your data may be processed in the United States or other countries where our service providers operate. By using the Service, you consent to this transfer.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">9. Changes to Privacy Policy</h3>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the Service.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-2">
            If you have questions about these Terms or Privacy Policy, contact us at:
          </p>
          <ul className="text-gray-700 space-y-1">
            <li><strong>Email:</strong> legal@llmbox.ai</li>
            <li><strong>Support:</strong> support@llmbox.ai</li>
            <li><strong>Privacy:</strong> privacy@llmbox.ai</li>
          </ul>
        </section>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

