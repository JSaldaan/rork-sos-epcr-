import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';
import {
  Shield,
  Smartphone,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  Star,
  Globe,
  Lock,
  Zap,
  Heart,
  Award,
  Phone,
  Mail,
  Calendar,
  X,
  Activity,
  FileText,
  Database,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SalesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SalesModal: React.FC<SalesModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'features' | 'pricing' | 'demo'>('features');
  const [enterpriseConfig, setEnterpriseConfig] = useState<any>(null);

  useEffect(() => {
    loadEnterpriseConfig();
  }, [visible]);

  const loadEnterpriseConfig = async () => {
    try {
      const configStr = await AsyncStorage.getItem('enterpriseConfig');
      if (configStr) {
        setEnterpriseConfig(JSON.parse(configStr));
      }
    } catch (error) {
      console.log('Using default enterprise config');
    }
  };

  // Use dynamic features from enterprise config or defaults
  const getFeatures = () => {
    if (enterpriseConfig?.features) {
      return enterpriseConfig.features
        .filter((f: any) => f.enabled)
        .slice(0, 6)
        .map((f: any) => ({
          icon: getFeatureIcon(f.name),
          title: f.name,
          description: f.description
        }));
    }
    
    // Default features
    return [
      {
        icon: <Shield size={24} color="#0066CC" />,
        title: "HIPAA Compliant Security",
        description: "Enterprise-grade security with end-to-end encryption and audit trails"
      },
      {
        icon: <Smartphone size={24} color="#0066CC" />,
        title: "Cross-Platform Access",
        description: "Native mobile apps and web access with real-time synchronization"
      },
      {
        icon: <BarChart3 size={24} color="#0066CC" />,
        title: "Advanced Analytics",
        description: "Real-time dashboards, performance metrics, and compliance reporting"
      },
      {
        icon: <Users size={24} color="#0066CC" />,
        title: "Multi-User Collaboration",
        description: "Role-based access for medical staff, supervisors, and administrators"
      },
      {
        icon: <Clock size={24} color="#0066CC" />,
        title: "Offline Capability",
        description: "Full functionality without internet connection with auto-sync"
      },
      {
        icon: <Heart size={24} color="#0066CC" />,
        title: "AI-Powered Features",
        description: "Voice-to-text transcription and intelligent form completion"
      }
    ];
  };

  const getFeatureIcon = (name: string) => {
    if (name.toLowerCase().includes('voice') || name.toLowerCase().includes('ai')) {
      return <Heart size={24} color="#0066CC" />;
    }
    if (name.toLowerCase().includes('offline')) {
      return <Clock size={24} color="#0066CC" />;
    }
    if (name.toLowerCase().includes('analytics') || name.toLowerCase().includes('report')) {
      return <BarChart3 size={24} color="#0066CC" />;
    }
    if (name.toLowerCase().includes('team') || name.toLowerCase().includes('multi')) {
      return <Users size={24} color="#0066CC" />;
    }
    if (name.toLowerCase().includes('trauma') || name.toLowerCase().includes('body')) {
      return <Activity size={24} color="#0066CC" />;
    }
    if (name.toLowerCase().includes('export') || name.toLowerCase().includes('data')) {
      return <Database size={24} color="#0066CC" />;
    }
    return <Shield size={24} color="#0066CC" />;
  };

  const features = getFeatures();

  // Use dynamic pricing from enterprise config or defaults
  const getPricingPlans = () => {
    if (enterpriseConfig?.pricing && enterpriseConfig?.features) {
      return Object.entries(enterpriseConfig.pricing)
        .filter(([key]) => key !== 'custom')
        .map(([key, plan]: [string, any]) => ({
          name: plan.name,
          price: `${plan.price}`,
          period: `per ${plan.period}`,
          features: enterpriseConfig.features
            .filter((f: any) => f.enabled && f.plans.includes(key))
            .slice(0, 6)
            .map((f: any) => f.name),
          popular: key === 'professional'
        }))
        .concat([{
          name: enterpriseConfig.pricing.custom?.name || 'Enterprise',
          price: 'Custom',
          period: 'contact for pricing',
          features: enterpriseConfig.features
            .filter((f: any) => f.enabled && f.plans.includes('custom'))
            .map((f: any) => f.name)
            .concat(['Custom integrations', 'Dedicated support', 'Training & onboarding']),
          popular: false
        }]);
    }
    
    // Default pricing
    return [
      {
        name: "Basic",
        price: "$99",
        period: "per month",
        features: [
          "Real-time PCR Management",
          "Offline Mode",
          "Data Export",
          "Email support",
          "HIPAA compliance"
        ],
        popular: false
      },
      {
        name: "Professional",
        price: "$299",
        period: "per month",
        features: [
          "All Basic features",
          "Voice-to-Text Documentation",
          "Trauma Body Diagram",
          "Multi-Team Support",
          "Audit Trail",
          "Priority support"
        ],
        popular: true
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "contact for pricing",
        features: [
          "All Professional features",
          "Advanced Analytics",
          "Custom Integrations",
          "Priority Support",
          "On-premise deployment",
          "Training & onboarding"
        ],
        popular: false
      }
    ];
  };

  const pricingPlans = getPricingPlans();

  const companyInfo = enterpriseConfig?.learnMore || {
    companyInfo: 'RORK Emergency Medical Services',
    contact: {
      email: 'sales@rork-ems.com',
      phone: '1-800-RORK-EMS',
      website: 'www.rork-ems.com'
    }
  };

  const handleContactSales = () => {
    Linking.openURL(`mailto:${companyInfo.contact.email}?subject=ePCR Demo Request`);
  };

  const handleScheduleDemo = () => {
    Linking.openURL(`https://${companyInfo.contact.website}/demo`);
  };

  const handleCallSales = () => {
    Linking.openURL(`tel:${companyInfo.contact.phone.replace(/[^0-9]/g, '')}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Shield size={32} color="#0066CC" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{companyInfo.companyInfo}</Text>
              <Text style={styles.headerSubtitle}>Professional ePCR System</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'features' && styles.activeTab]}
            onPress={() => setActiveTab('features')}
          >
            <Text style={[styles.tabText, activeTab === 'features' && styles.activeTabText]}>
              Features
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pricing' && styles.activeTab]}
            onPress={() => setActiveTab('pricing')}
          >
            <Text style={[styles.tabText, activeTab === 'pricing' && styles.activeTabText]}>
              Pricing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'demo' && styles.activeTab]}
            onPress={() => setActiveTab('demo')}
          >
            <Text style={[styles.tabText, activeTab === 'demo' && styles.activeTabText]}>
              Get Demo
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'features' && (
            <View style={styles.featuresContainer}>
              <Text style={styles.sectionTitle}>Enterprise Features</Text>
              <Text style={styles.sectionDescription}>
                {enterpriseConfig?.learnMore?.description || 'Comprehensive ePCR solution designed for healthcare professionals'}
              </Text>
              
              {features.map((feature: any, index: number) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIcon}>
                    {feature.icon}
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Trusted by Healthcare Professionals Worldwide</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>10,000+</Text>
                    <Text style={styles.statLabel}>Active Users</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>500+</Text>
                    <Text style={styles.statLabel}>Organizations</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>99.9%</Text>
                    <Text style={styles.statLabel}>Uptime</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>24/7</Text>
                    <Text style={styles.statLabel}>Support</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'pricing' && (
            <View style={styles.pricingContainer}>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>
              <Text style={styles.sectionDescription}>
                Flexible pricing options for organizations of all sizes
              </Text>
              
              {pricingPlans.map((plan, index) => (
                <View key={index} style={[styles.pricingCard, plan.popular && styles.popularCard]}>
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Star size={16} color="#fff" />
                      <Text style={styles.popularText}>Most Popular</Text>
                    </View>
                  )}
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>{plan.price}</Text>
                    <Text style={styles.period}>{plan.period}</Text>
                  </View>
                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature: string, featureIndex: number) => (
                      <View key={featureIndex} style={styles.featureRow}>
                        <CheckCircle size={16} color="#28A745" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              <View style={styles.enterpriseNote}>
                <Award size={20} color="#0066CC" />
                <Text style={styles.enterpriseText}>
                  Enterprise plans include custom integrations, dedicated support, and volume discounts
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'demo' && (
            <View style={styles.demoContainer}>
              <Text style={styles.sectionTitle}>Experience {companyInfo.companyInfo}</Text>
              <Text style={styles.sectionDescription}>
                See how our ePCR system can transform your patient care documentation
              </Text>

              <View style={styles.demoCard}>
                <Globe size={32} color="#0066CC" />
                <Text style={styles.demoCardTitle}>Live Demo</Text>
                <Text style={styles.demoCardDescription}>
                  Schedule a personalized demonstration with our healthcare technology specialists
                </Text>
                <TouchableOpacity style={styles.demoButton} onPress={handleScheduleDemo}>
                  <Calendar size={20} color="#fff" />
                  <Text style={styles.demoButtonText}>Schedule Demo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.contactGrid}>
                <TouchableOpacity style={styles.contactCard} onPress={handleCallSales}>
                  <Phone size={24} color="#0066CC" />
                  <Text style={styles.contactTitle}>Call Sales</Text>
                  <Text style={styles.contactInfo}>{companyInfo.contact.phone}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactCard} onPress={handleContactSales}>
                  <Mail size={24} color="#0066CC" />
                  <Text style={styles.contactTitle}>Email Us</Text>
                  <Text style={styles.contactInfo}>{companyInfo.contact.email}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>Why Choose {companyInfo.companyInfo}?</Text>
                <View style={styles.benefitsList}>
                  {(enterpriseConfig?.learnMore?.benefits || [
                    'Reduce documentation time by 70%',
                    'Ensure compliance with medical standards',
                    'Improve patient care quality',
                    'Real-time team collaboration',
                    'Secure cloud storage with encryption'
                  ]).slice(0, 5).map((benefit: string, index: number) => (
                    <View key={index} style={styles.benefitItem}>
                      <CheckCircle size={16} color="#28A745" />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  featureIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#0066CC',
    padding: 24,
    borderRadius: 16,
    marginTop: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#B3D9FF',
    marginTop: 4,
  },
  pricingContainer: {
    marginBottom: 24,
  },
  pricingCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    position: 'relative',
  },
  popularCard: {
    borderColor: '#0066CC',
    backgroundColor: '#F0F8FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  period: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  enterpriseNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  enterpriseText: {
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  demoContainer: {
    marginBottom: 24,
  },
  demoCard: {
    backgroundColor: '#F8F9FA',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  demoCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  demoCardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  demoButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  benefitsContainer: {
    backgroundColor: '#F0F8FF',
    padding: 20,
    borderRadius: 16,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});