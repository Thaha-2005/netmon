import Dashboard from './pages/Dashboard';
import { useToast, ToastContainer } from './components/Toast';

export default function App() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <>
      <Dashboard addToast={addToast} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
