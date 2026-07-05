import { useState, useEffect, useRef } from 'react';
import { subscribeToAppointments } from '../../services/appointmentService';
import { playNotificationSound, buildAppointmentNotification } from './adminHelpers';

/**
 * Randevuları gerçek-zamanlı dinler. Yeni randevu geldiğinde ses çalar
 * ve bildirim gösterir. İlk yüklemede bildirim tetiklenmez.
 */
export function useAppointmentsRealtime() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const knownIds = useRef(null); // null = henüz ilk veri gelmedi
  const notifTimeout = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToAppointments(
      (list) => {
        if (knownIds.current === null) {
          knownIds.current = new Set(list.map((a) => a.id));
        } else {
          const fresh = list.filter((a) => !knownIds.current.has(a.id));
          if (fresh.length > 0) {
            clearTimeout(notifTimeout.current);
            playNotificationSound();
            setNotification(buildAppointmentNotification(fresh));
            notifTimeout.current = setTimeout(() => setNotification(null), 8000);
          }
          knownIds.current = new Set(list.map((a) => a.id));
        }
        setAppointments(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      unsubscribe();
      clearTimeout(notifTimeout.current);
    };
  }, []);

  return {
    appointments,
    setAppointments,
    loading,
    notification,
    dismissNotification: () => setNotification(null),
  };
}
