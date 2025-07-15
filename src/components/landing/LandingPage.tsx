import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, HelpCircle, Slash as Flashcard, PenTool, Zap, BookMarked, Brain, Star, Facebook, Twitter, Instagram, Linkedin, Mail, BookOpen, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const styles = `
  @keyframes slide-up {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.8s ease-out forwards;
  }

  .animate-fade-in {
    animation: fade-in 1s ease-out forwards;
  }

  .animate-bounce-slow {
    animation: bounce-slow 2s infinite;
  }

  .animation-delay-200 {
    animation-delay: 200ms;
  }

  .animation-delay-400 {
    animation-delay: 400ms;
  }

  .animation-delay-600 {
    animation-delay: 600ms;
  }

  .animation-delay-2000 {
    animation-delay: 2000ms;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const LandingPage = () => {
  const navigate = useNavigate();

  // Animation utility
  const fadeInClass = "opacity-0 translate-y-6 animate-fade-in-up";

  // Navigation Bar
  const Navbar = () => (
    <nav className="w-full bg-[#0A0B14] border-b border-[#232336]/60 px-6 py-4 flex items-center justify-between fixed top-0 left-0 z-50 shadow-lg shadow-blue-900/10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white tracking-tight drop-shadow-glow">Beeka AI</span>
      </div>
      <div className="flex items-center gap-8">
        <Link to="/" className="text-white hover:text-blue-400 font-medium transition-colors">Home</Link>
        <a href="#features" className="text-white hover:text-blue-400 font-medium transition-colors">Features</a>
        <a href="#how-it-works" className="text-white hover:text-blue-400 font-medium transition-colors">How It Works</a>
        <Link to="/signin" className="text-white hover:text-blue-400 font-medium transition-colors">Sign In</Link>
        <button
          onClick={() => navigate('/signup')}
          className="ml-4 px-5 py-2 bg-white text-[#0A0B14] font-semibold rounded-lg shadow hover:bg-blue-600 hover:text-white transition-colors focus:ring-2 focus:ring-blue-500"
        >
          Get Started
        </button>
      </div>
    </nav>
  );

  // Hero Section (no orbs, just solid background)
  const Hero = () => (
    <section className="relative min-h-screen flex items-center pt-32 bg-[#0A0B14]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white opacity-0 animate-fade-in-up animation-delay-200">
            Level up your <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mt-4">Learning</span>
          </h1>
          <p className="text-gray-300 text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-400">
            Study smarter and faster. Ace your exams with Beeka AI. Our AI-powered platform helps you master any subject with personalized learning tools.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg scale-95 hover:scale-105 focus:ring-2 focus:ring-blue-500 opacity-0 animate-fade-in-up animation-delay-600"
            >
              Get Started For Free
            </button>
            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all backdrop-blur-sm opacity-0 animate-fade-in-up animation-delay-800">
              See How It Works
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // Features Section (no orbs, solid background, animated buttons)
  const Features = () => {
    const features = [
      {
        icon: MessageSquare,
        title: "AI Chat Assistant",
        description: "Get instant help and explanations from your AI study buddy on any subject or concept.",
      },
      {
        icon: FileText,
        title: "Generate Study Notes",
        description: "Create AI-powered comprehensive study notes from any material in seconds.",
      },
      {
        icon: HelpCircle,
        title: "Interactive Quizzes",
        description: "Test your knowledge with smart quizzes that adapt to your learning needs.",
      },
      {
        icon: Flashcard,
        title: "Smart Flashcards",
        description: "Review efficiently with flashcards that use spaced repetition technology.",
      },
      {
        icon: PenTool,
        title: "Essay & Report Help",
        description: "Get assistance writing, editing, and improving your academic papers.",
      },
      {
        icon: Zap,
        title: "Faster Learning",
        description: "Learn concepts up to 3x faster with personalized study techniques.",
      },
      {
        icon: BookMarked,
        title: "Organized Study Material",
        description: "Keep all your study materials neatly organized in custom folders.",
      },
      {
        icon: Brain,
        title: "Memory Techniques",
        description: "Apply proven memory techniques to retain information longer.",
      },
    ];

    return (
      <section id="features" className="py-24 bg-[#0A0B14]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4 opacity-0 animate-fade-in-up animation-delay-200">Cutting-Edge Features</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto opacity-0 animate-fade-in-up animation-delay-400">
              Discover how Beeka AI can transform your learning with our innovative technologies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-[#181825] border border-[#232336] rounded-xl p-8 shadow-lg flex flex-col gap-4 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 opacity-0 animate-fade-in-up animation-delay-${600 + index * 100}`}
                style={{ animationFillMode: 'forwards' }}
              >
                <div className="flex items-center mb-2">
                  <feature.icon className="w-8 h-8 text-blue-400 mr-3" />
                  <h3 className="text-white text-xl font-bold">{feature.title}</h3>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed">{feature.description}</p>
                <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow scale-95 hover:scale-105 focus:ring-2 focus:ring-blue-500 opacity-0 animate-fade-in-up animation-delay-1000">Learn More</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Testimonials Section (solid background)
  const Testimonials = () => {
    const testimonials = [
      {
        quote: "Study Buddy AI has completely transformed how I prepare for exams. I've improved my grades significantly with much less stress.",
        name: "Sarah Johnson",
        title: "Medical Student",
        rating: 5,
        image: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        design: "gradient"
      },
      {
        quote: "The AI chat feature feels like having a tutor available 24/7. It explains complex concepts in ways that actually make sense.",
        name: "Michael Chen",
        title: "Computer Science Major",
        rating: 5,
        image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        design: "glass"
      },
      {
        quote: "The AI-powered quizzes are challenging but fair. They've helped me identify my weak areas and improve significantly.",
        name: "Alex Rodriguez",
        title: "Business Student",
        rating: 5,
        image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        design: "neon"
      },
      {
        quote: "The flashcard system uses spaced repetition which helped me retain information long-term. Ace my finals thanks to Study Buddy!",
        name: "Jessica Patel",
        title: "Law Student",
        rating: 5,
        image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        design: "neon"
      },
     
      {
        quote: "I love how Study Buddy adapts to my learning style. The personalized approach makes studying so much more effective.",
        name: "Emma Wilson",
        title: "Psychology Major",
        rating: 5,
        image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        design: "glass"
      },
      {
        quote: "The note generation feature is incredible! It helped me organize my thoughts and create comprehensive study materials in minutes.",
        name: "David Kim",
        title: "Engineering Student",
        rating: 5,
        image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        design: "gradient"
      },
  
    ];

    return (
      <section className="py-20 bg-[#0A0B14] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e1433] via-[#13111c] to-[#1e1433] z-0"></div>
        <div className="absolute opacity-30 z-0 right-0 w-1/2 h-full">
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-600 rounded-full filter blur-[120px]"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Students Say</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of students who have transformed their learning experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`transform transition-all duration-500 hover:scale-105 ${
                  testimonial.design === 'gradient' 
                    ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-blue-500/20' 
                    : testimonial.design === 'glass'
                    ? 'bg-[#1a1625]/40 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10'
                    : 'bg-[#1a1625] p-6 rounded-xl shadow-lg border-2 border-blue-500/50 shadow-blue-500/20'
                }`}
              >
                <div className="flex mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} 
                    />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-6 flex-grow text-lg leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center mt-auto">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-14 h-14 rounded-full object-cover mr-4 ring-2 ring-blue-500/50"
                  />
                  <div>
                    <p className="font-semibold text-white text-lg">{testimonial.name}</p>
                    <p className="text-sm text-blue-400">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              <div className="text-white text-opacity-70 font-semibold">Trusted by students from:</div>
              <div className="text-white text-opacity-70 font-semibold">Harvard University</div>
              <div className="text-white text-opacity-70 font-semibold">Stanford University</div>
              <div className="text-white text-opacity-70 font-semibold">MIT</div>
              <div className="text-white text-opacity-70 font-semibold">Oxford University</div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // How It Works Section (solid background)
  const HowItWorks = () => {
    const youtubeVideoId = 'FMU0j_ly4kk';
    return (
      <section id="how-it-works" className="py-20 bg-[#0A0B14]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How Study Buddy Works</h2>
              <p className="text-xl text-gray-300">
                Watch this quick guide to see how Study Buddy can transform your learning experience
              </p>
            </div>
            <div className="aspect-video bg-[#1a1625] rounded-xl overflow-hidden shadow-2xl border border-[#322c45]/40">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&modestbranding=1&rel=0&controls=1`}
                title="How Study Buddy Works"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="text-center mt-12">
              <button 
                onClick={() => navigate('/signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 opacity-0 animate-fade-in-up animation-delay-600"
              >
                Start Your Learning Journey
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Call to Action Section (solid background)
  const CTASection = () => (
    <section className="py-24 bg-[#0A0B14] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 z-0"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Study Habits?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of students who are already learning smarter with Study Buddy.
            </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => navigate('/signup')}
              className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full text-lg transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
            >
              <span className="relative z-10">Start Your Free Trial</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            <button 
              onClick={() => navigate('/signin')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-lg transition-all transform hover:scale-105 backdrop-blur-sm"
            >
              Sign In
            </button>
          </div>
          
          <p className="mt-6 text-gray-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );

  // Footer
  const Footer = () => (
    <footer className="bg-[#0A0B14] py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
        <div className="flex justify-center space-x-6 mb-6">
          <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
          <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
          <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
          <a href="#" className="hover:text-white transition-colors"><Linkedin size={20} /></a>
          <a href="#" className="hover:text-white transition-colors"><Mail size={20} /></a>
        </div>
        <div className="mb-6">
          <a href="#features" className="mx-3 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="mx-3 hover:text-white transition-colors">How It Works</a>
        </div>
        <p>&copy; 2023 Study Buddy. All rights reserved.</p>
      </div>
    </footer>
  );

  return (
    <div className="bg-[#0A0B14] text-white min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTASection />
      <Footer />
      {/* Animations */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.4,0,0.2,1) both;
        }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }
        .animation-delay-900 { animation-delay: 0.9s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1100 { animation-delay: 1.1s; }
        .animation-delay-1200 { animation-delay: 1.2s; }
        .animation-delay-1300 { animation-delay: 1.3s; }
        .animation-delay-1400 { animation-delay: 1.4s; }
        .animation-delay-1500 { animation-delay: 1.5s; }
        .animation-delay-1600 { animation-delay: 1.6s; }
        .animation-delay-1700 { animation-delay: 1.7s; }
        .animation-delay-1800 { animation-delay: 1.8s; }
        .animation-delay-1900 { animation-delay: 1.9s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .drop-shadow-glow { text-shadow: 0 0 8px #3B82F6, 0 0 2px #fff; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow { animation: pulse-slow 6s infinite; }
      `}</style>
    </div>
  );
};

export default LandingPage;