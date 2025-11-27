import { createContext, useContext, useMemo, useState, useCallback } from 'react';

const PeopleContext = createContext(null);

const initialSupervisors = [
  { id: 'sup-01', name: 'หัวหน้าช่างเอก', phone: '0800000001' },
  { id: 'sup-02', name: 'หัวหน้าช่างนุ่น', phone: '0800000002' },
];

const initialTechnicians = [
  { id: 'tech-01', name: 'สมชาย', role: 'IT Support', supervisorId: 'sup-01', phone: '0900000001' },
  { id: 'tech-02', name: 'วสันต์', role: 'Facility', supervisorId: 'sup-01', phone: '0900000002' },
  { id: 'tech-05', name: 'แบงค์', role: 'Facility', supervisorId: 'sup-01', phone: '0900000006' },
  { id: 'tech-03', name: 'พีระ', role: 'Network', supervisorId: 'sup-02', phone: '0900000003' },
  { id: 'tech-04', name: 'กมล', role: 'IT Ops', supervisorId: 'sup-02', phone: '0900000004' },
];

export function PeopleProvider({ children }) {
  const [supervisors, setSupervisors] = useState(initialSupervisors);
  const [technicians, setTechnicians] = useState(initialTechnicians);

  const techById = useMemo(
    () => Object.fromEntries(technicians.map((t) => [t.id, t])),
    [technicians],
  );
  const supById = useMemo(
    () => Object.fromEntries(supervisors.map((s) => [s.id, s])),
    [supervisors],
  );

  const addSupervisor = useCallback((sup) => {
    setSupervisors((prev) => [...prev, sup]);
  }, []);

  const addTechnician = useCallback((tech) => {
    setTechnicians((prev) => [...prev, tech]);
  }, []);

  const updateTechnician = useCallback((id, patch) => {
    setTechnicians((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }, []);

  const value = useMemo(
    () => ({
      supervisors,
      technicians,
      addSupervisor,
      addTechnician,
      updateTechnician,
      getTechniciansByIds: (ids = []) =>
        ids
          .map((id) => techById[id])
          .filter(Boolean),
      getSupervisorById: (id) => (id ? supById[id] || null : null),
    }),
    [addSupervisor, addTechnician, supById, techById, supervisors, technicians, updateTechnician],
  );

  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePeople = () => {
  const ctx = useContext(PeopleContext);
  if (!ctx) {
    throw new Error('usePeople must be used within PeopleProvider');
  }
  return ctx;
};
