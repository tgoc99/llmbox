import { Mail, Zap, MessageCircle, Shield, Clock, Sparkles } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Mail className="w-6 h-6" />,
    title: 'Email-Based',
    description: 'Use your favorite email client. No apps to download or new platforms to learn.',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Powered by GPT',
    description: 'Get intelligent, contextual responses powered by OpenAI\'s advanced language models.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lightning Fast',
    description: 'Responses delivered to your inbox in under 30 seconds. No waiting around.',
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'Email Threading',
    description: 'Maintains conversation context through email threads for natural back-and-forth.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Secure & Private',
    description: 'Enterprise-grade security with encrypted communication and no data retention.',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: '24/7 Available',
    description: 'Your AI assistant is always ready to help, any time of day or night.',
  },
];

const Features = (): JSX.Element => {
  return (
    <section id="features" className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="heading-lg mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-subtle">
            A powerful AI assistant that fits seamlessly into your existing workflow
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard = ({ feature }: FeatureCardProps): JSX.Element => {
  return (
    <div className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-200">
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 mb-4 bg-primary-100 text-primary-600 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors duration-200">
        {feature.icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2 text-gray-900">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="text-subtle">
        {feature.description}
      </p>
    </div>
  );
};

export default Features;

