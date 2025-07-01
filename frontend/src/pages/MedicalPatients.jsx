import React from 'react';
import MedicalLayout from '../components/layout/MedicalLayout';
import PatientList from '../components/medical/PatientList';

const MedicalPatients = () => {
  return (
    <MedicalLayout>
      <PatientList />
    </MedicalLayout>
  );
};

export default MedicalPatients;