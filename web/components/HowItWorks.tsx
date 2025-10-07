import { Send, Bot, Inbox, ArrowRight } from 'lucide-react';

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: <Send className="w-8 h-8" />,
    title: 'Send an Email',
    description: 'Compose your question or request in your email client and send it to assistant@yourdomain.com',
  },
  {
    number: 2,
    icon: <Bot className="w-8 h-8" />,
    title: 'AI Processes',
    description: 'Our OpenAI-powered system analyzes your message and generates an intelligent, contextual response',
  },
  {
    number: 3,
    icon: <Inbox className="w-8 h-8" />,
    title: 'Get Your Reply',
    description: 'Receive a detailed response directly in your inbox within 30 seconds, ready to continue the conversation',
  },
];

const HowItWorks = (): JSX.Element => {
  return (
    <section id="how-it-works" className="bg-gradient-to-br from-gray-50 to-primary-50 section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="heading-lg mb-4">
            How It Works
          </h2>
          <p className="text-xl text-subtle">
            Three simple steps to start chatting with AI through email
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <StepCard step={step} />

                {/* Arrow connector (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/3 -right-4 transform translate-x-1/2 items-center justify-center w-8 h-8 text-primary-400 z-10">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Example Email Flow */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Example Conversation</h3>

            <div className="space-y-6">
              {/* User Email */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">You</span>
                </div>
                <div className="flex-1">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-xs text-blue-600 font-medium mb-1">To: assistant@yourdomain.com</div>
                    <p className="text-gray-800">
                      Can you help me write a professional email to decline a meeting invitation politely?
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="text-xs text-primary-600 font-medium mb-1">From: AI Assistant</div>
                    <p className="text-gray-800">
                      I'd be happy to help you craft a polite decline. Here's a professional template you can customize:
                      <br /><br />
                      "Thank you for the invitation. Unfortunately, I have a prior commitment at that time and won't be able to attend. I appreciate you thinking of me, and I hope we can find another opportunity to connect soon."
                      <br /><br />
                      Feel free to adjust the wording to match your personal style!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-subtle mt-6">
              💡 Tip: Reply to the email to continue the conversation with context
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

interface StepCardProps {
  step: Step;
}

const StepCard = ({ step }: StepCardProps): JSX.Element => {
  return (
    <div className="relative bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-primary-300 hover:shadow-lg transition-all duration-200 h-full">
      {/* Step Number Badge */}
      <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
        {step.number}
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center w-16 h-16 mb-6 bg-primary-100 text-primary-600 rounded-xl mt-4">
        {step.icon}
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold mb-3 text-gray-900">
        {step.title}
      </h3>
      <p className="text-subtle">
        {step.description}
      </p>
    </div>
  );
};

export default HowItWorks;

