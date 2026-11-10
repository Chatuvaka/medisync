import React, { createContext, useContext, useState, useEffect } from 'react';
import { SmartwatchService, WatchSyncEvent } from '../services/smartwatchService';
import { SmartwatchState, ScheduledDose } from '../types';
import { useMedication } from './MedicationContext';

interface SmartwatchContextType {
  watchState: SmartwatchState;
  activeReminder: ScheduledDose | null;
  toggleSimulationMode: (enabled: boolean) => void;
  confirmFromWatch: (doseId: string) => Promise<void>;
  snoozeFromWatch: (doseId: string, minutes?: number) => Promise<void>;
  skipFromWatch: (doseId: string) => Promise<void>;
  triggerTestReminderOnWatch: (dose: ScheduledDose) => void;
  dismissWatchReminder: () => void;
  flushPendingQueue: () => Promise<number>;
}

const SmartwatchContext = createContext<SmartwatchContextType | undefined>(undefined);

export const SmartwatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { refreshAll } = useMedication();
  const [watchState, setWatchState] = useState<SmartwatchState>(SmartwatchService.getState());
  const [activeReminder, setActiveReminder] = useState<ScheduledDose | null>(null);

  useEffect(() => {
    const unsubState = SmartwatchService.subscribe((state) => {
      setWatchState(state);
    });

    const unsubReminder = SmartwatchService.subscribeToReminder((reminder) => {
      setActiveReminder(reminder);
    });

    return () => {
      unsubState();
      unsubReminder();
    };
  }, []);

  const toggleSimulationMode = (enabled: boolean) => {
    SmartwatchService.setSimulationMode(enabled);
  };

  const confirmFromWatch = async (doseId: string) => {
    await SmartwatchService.sendWatchAction(doseId, 'CONFIRM');
    await refreshAll();
  };

  const snoozeFromWatch = async (doseId: string, minutes: number = 10) => {
    await SmartwatchService.sendWatchAction(doseId, 'SNOOZE', minutes);
    await refreshAll();
  };

  const skipFromWatch = async (doseId: string) => {
    await SmartwatchService.sendWatchAction(doseId, 'SKIP');
    await refreshAll();
  };

  const triggerTestReminderOnWatch = (dose: ScheduledDose) => {
    SmartwatchService.triggerIncomingDose(dose);
  };

  const dismissWatchReminder = () => {
    SmartwatchService.clearActiveReminder();
  };

  const flushPendingQueue = async () => {
    const count = await SmartwatchService.flushPendingQueue();
    if (count > 0) {
      await refreshAll();
    }
    return count;
  };

  return (
    <SmartwatchContext.Provider
      value={{
        watchState,
        activeReminder,
        toggleSimulationMode,
        confirmFromWatch,
        snoozeFromWatch,
        skipFromWatch,
        triggerTestReminderOnWatch,
        dismissWatchReminder,
        flushPendingQueue,
      }}
    >
      {children}
    </SmartwatchContext.Provider>
  );
};

export const useSmartwatch = () => {
  const context = useContext(SmartwatchContext);
  if (!context) {
    throw new Error('useSmartwatch debe ser utilizado dentro de un SmartwatchProvider');
  }
  return context;
};

