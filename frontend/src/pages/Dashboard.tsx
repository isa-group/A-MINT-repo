import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BarChart3, Settings2, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const features = [
    {
      icon: BarChart3,
      title: "Analysis Tool",
      description: "Upload your Pricing2Yaml file and get instant insights, summaries, and deep analysis powered by AI.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      action: () => navigate('/analysis'),
      stats: "Advanced AI Analysis"
    },
    {
      icon: Settings2,
      title: "A-MINT Tool",
      description: "Transform your static HTML pricing webpage with advanced AI-powered operations and download results in Pricing2YAML format.",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
      action: () => navigate('/transform'),
      stats: "Smart Transformations"
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto space-y-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="p-4 bg-gradient-to-br from-accent-500 to-accent-600 rounded-3xl shadow-xl "
          >
            <Sparkles className="w-12 h-12 text-black" />
          </motion.div>
        </div>

        <motion.h1
          variants={itemVariants}
          className="text-6xl font-bold bg-gradient-to-r from-primary-800 via-accent-600 to-purple-600 bg-clip-text text-transparent leading-tight"
        >
          Welcome!
        </motion.h1>
        
        <motion.p
          variants={itemVariants}
          className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
        >
          Your pricing platform to transform complex pricings structures into actionable insights
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200/50 w-fit mx-auto"
        >
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>Powered by Advanced AI • H.A.R.V.E.Y.</span>
        </motion.div>
      </motion.div>

      {/* Tools Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden bg-gradient-to-br ${feature.bgColor} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-white/50 group`}
            onClick={feature.action}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <div className={`w-full h-full bg-gradient-to-br ${feature.color} rounded-full blur-2xl`} />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div className={`p-4 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ x: 5 }}
                >
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </motion.div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-primary-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>{feature.stats}</span>
              </div>
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        ))}
      </motion.div>

      {/* Stats Section */}
      <motion.div
        variants={itemVariants}
        className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200/50"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-accent-600">AI-Powered</div>
            <div className="text-gray-600">Advanced Analysis</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-purple-600">Secure</div>
            <div className="text-gray-600">Data Processing</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-emerald-600">Instant</div>
            <div className="text-gray-600">Results & Insights</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
