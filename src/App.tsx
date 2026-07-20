import React, { useState, useEffect } from 'react';
import CustomerPortal from './components/CustomerPortal';
import { Order } from './types';
import { 
  Wifi
} from 'lucide-react';

export default function App() {
  const [assignedTable, setAssignedTable] = useState<string>('15');
  const [orders, setOrders] = useState<Order[]>([]);

  // Hydrate initial table number and sync state from localStorage
  useEffect(() => {
    const storedTable = localStorage.getItem('axionix_assigned_table');
    if (storedTable) {
      setAssignedTable(storedTable);
    } else {
      localStorage.setItem('axionix_assigned_table', '15');
    }

    const storedOrders = localStorage.getItem('axionix_orders_history');
    if (storedOrders) {
      try {
        setOrders(JSON.parse(storedOrders));
      } catch (e) {
        setOrders([]);
      }
    }
  }, []);

  const handleNewOrder = (order: Order) => {
    const updatedOrders = [order, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('axionix_orders_history', JSON.stringify(updatedOrders));
  };

  return (
    <div className="min-h-screen bg-sleek-gradient text-[#1c1e19] flex flex-col justify-between selection:bg-[#cb4b31] selection:text-white">
      
      {/* Top Navigation / App Branding Header */}
      <nav className="bg-white border-b-3 border-[#1c1e19] py-4 px-6 sticky top-0 z-40 shadow-[0_4px_12px_rgba(28,30,25,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-[#cb4b31] border-2 border-[#1c1e19] p-2 rounded-xl shadow-retro-sm transform -rotate-3">
              <Wifi className="w-5 h-5 text-[#faf5eb] animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 font-display text-[#1c1e19] uppercase italic">
                AXIONIK
              </h1>
            </div>
          </div>

        </div>
      </nav>

      {/* Main Single Column Centered Kiosk Content */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center items-center">
        
        <div className="w-full">
          <CustomerPortal 
            assignedTable={assignedTable} 
            onNewOrder={handleNewOrder} 
          />
        </div>

      </main>

      {/* Subtle Page Footer */}
      <footer className="border-t-3 border-[#1c1e19] bg-white py-6 px-6 text-center shrink-0">
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-[#606356] font-bold uppercase tracking-wider leading-relaxed max-w-xl text-center md:text-left">
            🍔 THIS PORTAL IS HOSTED BY AXIONIK. ALL RIGHTS RESERVED. ENJOY YOUR CRAVINGS!
          </p>
          <div className="text-[10px] text-[#1c1e19] font-mono font-black uppercase tracking-widest bg-[#dd9d47] border-2 border-[#1c1e19] px-2 py-1 rounded shadow-retro-sm">
            AXIONIK v2.4.0
          </div>
        </div>
      </footer>

    </div>
  );
}
