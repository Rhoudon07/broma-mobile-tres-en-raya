import { registerRootComponent } from 'expo';
import App from './App';

// En Web, public/index.html ya renderiza el simulador completo con Canvas Matrix y Web Audio.
// En Android/iOS (Expo Go), montamos el componente nativo App.
const hasStandaloneWebApp =
  typeof document !== 'undefined' && document.getElementById('app-container') !== null;

if (!hasStandaloneWebApp) {
  registerRootComponent(App);
}
