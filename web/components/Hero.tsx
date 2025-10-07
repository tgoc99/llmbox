import { Mail, Sparkles } from 'lucide-react';

const Hero = (): JSX.Element => {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container-custom section-padding">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/80 backdrop-blur-sm border border-primary-200 rounded-full shadow-sm">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-900">
              Powered by OpenAI GPT
            </span>
          </div>

          {/* Headline */}
          <h1 className="heading-xl mb-6 text-balance">
            Chat with AI
            <br />
            <span className="text-primary-600">Through Email</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-subtle mb-10 max-w-3xl mx-auto text-balance">
            No app downloads. No sign-ups. No hassle.
            <br />
            Just send an email and get intelligent responses in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a
              href="#how-it-works"
              className="btn-primary w-full sm:w-auto"
            >
              Get Started
            </a>
            <a
              href="#features"
              className="btn-secondary w-full sm:w-auto"
            >
              Learn More
            </a>
          </div>

          {/* Email Example */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 text-left">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Send email to:
                  </div>
                  <div className="text-lg font-mono font-semibold text-primary-600 break-all">
                    assistant@yourdomain.com
                  </div>
                </div>
              </div>
              <div className="pl-13">
                <p className="text-sm text-subtle italic">
                  &quot;Can you help me brainstorm ideas for my project?&quot;
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-subtle">
              Response delivered to your inbox in under 30 seconds ⚡
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
};

export default Hero;

