import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let backButtonListener;
    
    const listenToBackButton = async () => {
      backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // If we are on the root or dashboard, exit the app
        if (location.pathname === '/' || location.pathname === '/dashboard') {
          CapacitorApp.exitApp();
        } else if (canGoBack) {
          // If the webview itself has history (which React Router usually uses)
          window.history.back();
        } else {
          // Fallback to navigate -1 if capacitor thinks it can't go back but we are not at root
          navigate(-1);
        }
      });
    };

    listenToBackButton();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [location, navigate]);

  return null;
};

export default BackButtonHandler;
