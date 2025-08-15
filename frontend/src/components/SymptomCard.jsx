const SymptomCard = () => {
  return (
    <div className="bg-pastelBlue rounded-2xl shadow-md p-6 max-w-md w-full">
      <h3 className="text-xl font-poppins text-cns mb-2">Registrar Síntomas</h3>
      <p className="text-sm text-gray-700 font-sans">
        Ingrese los síntomas actuales del paciente para comenzar el triaje.
      </p>
    </div>
  );
};

export default SymptomCard;
