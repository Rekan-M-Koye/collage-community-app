export const universitiesData = {
  erbilPolytechnic: {
    key: 'erbilPolytechnic',
    colleges: {
      
      Enformatic : {
        key: 'Enformatic',
        departments: [
          'ICTE',
          'ISE',
          'AIE',
        ]
      },
      technicalEngineering: {
        key: 'technicalEngineering',
        departments: [
          'civil',
          'mechanical',
          'electrical',
          'computerEngineering',
          'electronics',
          'architecture',
          'surveying',
          'construction',
        ]
      },
      technicalAdministration: {
        key: 'technicalAdministration',
        departments: [
          'accounting',
          'businessManagement',
          'finance',
          'marketing',
          'hotelManagement',
          'tourism',
        ]
      },
      technicalHealth: {
        key: 'technicalHealth',
        departments: [
          'nursing',
          'medicalLaboratory',
          'radiology',
          'anesthesia',
          'pharmacy',
          'dentalHealth',
        ]
      },
      technicalComputer: {
        key: 'technicalComputer',
        departments: [
          'softwareDevelopment',
          'networkManagement',
          'systemsAdministration',
          'webDesign',
          'databaseManagement',
        ]
      },
      erbilTechnical: {
        key: 'erbilTechnical',
        departments: [
          'general',
        ]
      },
      shaqlawaTechnical: {
        key: 'shaqlawaTechnical',
        departments: [
          'general',
        ]
      },
      koyaTechnical: {
        key: 'koyaTechnical',
        departments: [
          'general',
        ]
      },
      mergasurTechnical: {
        key: 'mergasurTechnical',
        departments: [
          'general',
        ]
      },
      akre: {
        key: 'akre',
        departments: [
          'general',
        ]
      },
      soran: {
        key: 'soran',
        departments: [
          'general',
        ]
      },
    }
  },
};

export const getUniversityKeys = () => {
  return Object.keys(universitiesData);
};

export const getCollegesForUniversity = (universityKey) => {
  if (!universityKey || !universitiesData[universityKey]) {
    return [];
  }
  return Object.keys(universitiesData[universityKey].colleges);
};

export const getDepartmentsForCollege = (universityKey, collegeKey) => {
  if (!universityKey || !collegeKey || !universitiesData[universityKey]) {
    return [];
  }
  const university = universitiesData[universityKey];
  if (!university.colleges[collegeKey]) {
    return [];
  }
  return university.colleges[collegeKey].departments;
};
