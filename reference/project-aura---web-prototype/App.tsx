import React, { useState, useEffect } from 'react';
import { MapHUD } from './components/MapHUD';
import { GlobeScene } from './components/GlobeScene';
import { RideSelection } from './components/RideSelection';
import { NeonButton } from './components/ui/NeonButton';
import { GlassView } from './components/ui/GlassView';
import { AIChat } from './components/AIChat';
import { FloatingTabBar } from './components/ui/FloatingTabBar';
import { ActiveRide } from './components/ActiveRide';
import { RideHistory } from './components/RideHistory';
import { Profile } from './components/Profile';
import { LocationTab } from './components/LocationTab';
import { DriverApp } from './components/DriverApp';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthScreen } from './components/AuthScreen';
import { AppPhase, RideOption, Tab, Coordinates, PaymentMethod, UserRole, RidePreferences } from './types';
import { MOCK_LOCATIONS } from './constants';
import { useToast } from './context/ToastContext';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [role, setRole] = useState<UserRole>('rider');
  const [phase, setPhase] = useState<AppPhase>(AppPhase.SPLASH);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [activeRide, setActiveRide] = useState<RideOption | null>(null);
  const [activePayment, setActivePayment] = useState<PaymentMethod | null>(null);
  const [activePrefs, setActivePrefs] = useState<RidePreferences | null>(null);
  
  // Globe State
  const [targetCoords, setTargetCoords] = useState<Coordinates | null>(null);
  const [isGlobeZoomed, setIsGlobeZoomed] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Map/Driver State
  const [driverLocation, setDriverLocation] = useState<Coordinates | null>(null);

  // Simulate Splash Screen
  useEffect(() => {
    if (phase === AppPhase.SPLASH) {
      const timer = setTimeout(() => {
        setPhase(AppPhase.AUTH); // NEW: Go to Auth instead of Home
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Handle Role Switching
  const handleSwitchRole = (newRole: UserRole) => {
      setRole(newRole);
      showToast(`Switched to ${newRole.toUpperCase()} Mode`, 'info');
  };

  // RIDER APP LOGIC --------------------------------------------
  const handleLocationSelect = (location: { lat: number, lng: number }) => {
      setTargetCoords(location);
      setIsGlobeZoomed(true);

      // Animation Sequence: Fly to Globe -> Transition to Map -> Show Ride Select
      setTimeout(() => {
          setPhase(AppPhase.TRANSITION_TO_MAP);
          setTimeout(() => {
             setShowMap(true);
             setPhase(AppPhase.RIDE_SELECT);
          }, 1500); // Wait for zoom animation
      }, 500);
  };

  const handleRideSelect = (ride: RideOption, paymentMethod: PaymentMethod, prefs: RidePreferences) => {
    setActiveRide(ride);
    setActivePayment(paymentMethod);
    setActivePrefs(prefs);
    setPhase(AppPhase.ACTIVE_RIDE);
  };

  const handleTabSelect = (tab: Tab) => {
    setActiveTab(tab);
    if (phase !== AppPhase.ACTIVE_RIDE && phase !== AppPhase.RIDE_SELECT) {
        setPhase(AppPhase.HOME);
        // Reset Globe view if going home
        if (tab === Tab.HOME) {
            setIsGlobeZoomed(false);
            setTargetCoords(null);
            setShowMap(false);
        }
    }
  };

  const resetToHome = () => {
      setPhase(AppPhase.HOME);
      setShowMap(false);
      setIsGlobeZoomed(false);
      setTargetCoords(null);
      setActiveTab(Tab.HOME);
      setDriverLocation(null);
  };

  const renderRiderContent = () => {
    // 1. If Active Ride
    if (phase === AppPhase.ACTIVE_RIDE && activeRide && activePayment) {
        return (
            <ActiveRide 
                ride={activeRide} 
                paymentMethod={activePayment} 
                onCancel={resetToHome} 
                onDriverUpdate={setDriverLocation}
            />
        );
    }

    // 2. If Selecting Ride
    if (phase === AppPhase.RIDE_SELECT) {
        return (
            <div className="h-[60vh] w-full max-w-lg mx-auto">
                <RideSelection 
                    onBack={resetToHome}
                    onSelect={handleRideSelect}
                />
            </div>
        );
    }

    // 3. Tab Content
    switch (activeTab) {
        case Tab.ACTIVITY:
            return <RideHistory />;
        case Tab.PROFILE:
            return <Profile onSwitchRole={handleSwitchRole} />;
        case Tab.LOCATION:
            return <LocationTab />;
        case Tab.HOME:
        default:
            // Hide Home controls during transition
            if (phase === AppPhase.TRANSITION_TO_MAP) return null;

            return (
                <div className="p-6 pb-12 max-w-lg mx-auto w-full animate-[slideUp_0.5s_ease-out]">
                    <GlassView className="p-6 mb-4">
                        <div className="text-aura-textSecondary text-sm mb-2 uppercase tracking-wide">{t('home.where_to')}</div>
                        
                        {/* Mock Input triggering the "Fly To" animation */}
                        <div 
                            className="flex items-center gap-4 group cursor-pointer"
                            onClick={() => handleLocationSelect({ lat: 34.0922, lng: -118.3913 })}
                        >
                            <div className="w-2 h-2 rounded-full bg-aura-primary shadow-[0_0_10px_#00F5FF]" />
                            <div className="text-xl font-medium text-white/90 group-hover:text-aura-primary transition-colors">
                                SoHo House, West Hollywood
                            </div>
                        </div>
                    </GlassView>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                        {MOCK_LOCATIONS.map(loc => (
                            <button 
                                key={loc.name} 
                                onClick={() => handleLocationSelect(loc)}
                                className="px-6 py-3 rounded-xl bg-aura-surface border border-white/5 hover:border-aura-primary/50 transition-colors whitespace-nowrap text-white"
                            >
                                {loc.name}
                            </button>
                        ))}
                    </div>

                    <NeonButton 
                        label={t('home.request_ride')} 
                        fullWidth 
                        onClick={() => handleLocationSelect({ lat: 34.0522, lng: -118.2437 })} 
                    />
                </div>
            );
    }
  };

  // MAIN RENDER ------------------------------------------------
  
  // 1. Splash Screen
  if (phase === AppPhase.SPLASH) {
     return (
        <div className="relative w-full h-screen font-sans bg-[#050607] flex flex-col items-center justify-center overflow-hidden">
            <div className="relative">
                <div className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 relative z-10">
                    AURA
                </div>
                <div className="absolute inset-0 blur-2xl bg-aura-primary/20 animate-pulse" />
            </div>
            <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-aura-primary w-full origin-left animate-[grow_2s_ease-in-out]" />
            </div>
        </div>
     );
  }

  // 2. Auth Screen
  if (phase === AppPhase.AUTH) {
      return <AuthScreen onComplete={() => setPhase(AppPhase.HOME)} />;
  }

  // 3. Driver Mode
  if (role === 'driver') {
      return (
          <>
             <DriverApp />
             {/* Back to Rider escape hatch (hidden in top right of driver app strictly for proto) */}
             <button 
                onClick={() => handleSwitchRole('rider')}
                className="fixed top-4 right-4 z-[100] w-8 h-8 opacity-20 hover:opacity-100 transition-opacity bg-black rounded-full text-xs text-white flex items-center justify-center border border-white/20"
                title="Exit Driver Mode"
             >
                 ✕
             </button>
          </>
      );
  }

  // 4. Admin Mode
  if (role === 'admin') {
      return (
          <>
            <AdminDashboard />
             {/* Back to Rider escape hatch */}
             <button 
                onClick={() => handleSwitchRole('rider')}
                className="fixed bottom-4 right-4 z-[100] w-10 h-10 bg-black/80 rounded-full text-white flex items-center justify-center border border-white/20 hover:bg-aura-primary hover:text-black transition-colors"
                title="Exit Admin Mode"
             >
                 ✕
             </button>
          </>
      );
  }

  // 5. Rider Mode (Default)
  return (
    <div className="relative w-full h-screen font-sans text-aura-textPrimary overflow-hidden bg-[#050607]">
      
      {/* Layer 0: 3D Globe Scene (Always Present, Fades out when Map is active) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${showMap ? 'opacity-0' : 'opacity-100'}`}>
         <GlobeScene targetCoordinates={targetCoords} isZoomed={isGlobeZoomed} />
      </div>

      {/* Layer 1: Map HUD (Fades in) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${showMap ? 'opacity-100' : 'opacity-0'}`}>
         {showMap && <MapHUD driverLocation={driverLocation} />}
      </div>

      {/* Layer 2: Foreground UI */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        
        {/* Header HUD - Always visible except Splash */}
        <div className="w-full p-6 flex justify-between items-start pointer-events-auto z-50">
            <GlassView className="px-4 py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/20" />
                <div>
                    <div className="text-xs text-aura-textSecondary uppercase tracking-widest">{t('home.welcome')}</div>
                    <div className="text-sm font-semibold text-white">Alex V.</div>
                </div>
            </GlassView>
            <AIChat />
        </div>

        {/* Dynamic Main Content Area */}
        <div className="flex-1 flex flex-col justify-end pb-32 pointer-events-auto">
            {renderRiderContent()}
        </div>

        {/* Floating Tab Bar - Visible in main phases */}
        {phase !== AppPhase.RIDE_SELECT && phase !== AppPhase.ACTIVE_RIDE && phase !== AppPhase.TRANSITION_TO_MAP && (
            <FloatingTabBar activeTab={activeTab} onTabSelect={handleTabSelect} />
        )}

      </div>
    </div>
  );
};

export default App;