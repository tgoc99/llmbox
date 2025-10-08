import { Mail, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const CTA = (): JSX.Element => {
  const [copied, setCopied] = useState(false);
  const emailAddress = 'assistant@mail.llmbox.pro';

  const handleCopyEmail = (): void => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-800 section-padding">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-white/10 backdrop-blur-sm rounded-full">
            <Mail className="w-8 h-8 text-white" />
          </div>

          {/* Headline */}
          <h2 className="heading-lg text-white mb-6">
            Ready to Get Started?
          </h2>

          {/* Description */}
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Start chatting with AI right now. No registration, no downloads, no complexity.
          </p>

          {/* Email Display with Copy Button */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <div className="flex-1 text-left sm:text-center w-full">
                <div className="text-sm text-primary-100 mb-2">Send your first email to:</div>
                <div className="text-2xl font-mono font-bold text-white break-all">
                  {emailAddress}
                </div>
              </div>
              <button
                onClick={handleCopyEmail}
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200 w-full sm:w-auto justify-center"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:assistant@mail.llmbox.pro"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200 w-full sm:w-auto justify-center"
            >
              <Mail className="w-5 h-5" />
              <span>Open Email Client</span>
            </a>
          </div>

          {/* Footer Note */}
          <p className="mt-10 text-sm text-primary-200">
            ⚡ Average response time: &lt;30 seconds
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;

