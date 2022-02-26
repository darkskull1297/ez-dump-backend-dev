export const dataProfile = object => {
  const {
    companyCommon,
    contacts,
    jobRadius,
    parkingLotAddress,
    DOTNumber,
    generalLiabilityInsurance,
    autoLiabilityInsurance,
    workersCompensationsInsurance,
  } = object;
  return {
    companyInfo: {
      name: companyCommon.name,
      address: companyCommon.address,
      EINNumber: companyCommon.EINNumber,
      fax: companyCommon.fax,
      officePhoneNumber: companyCommon.officePhoneNumber,
    },
    jobInformation: {
      jobRadius,
      parkingLotAddress: parkingLotAddress.address,
      DOTNumber,
    },
    generalLiabilityInsurance,
    autoLiabilityInsurance,
    workersCompensationsInsurance,
    contacts,
  };
};

export const search = values => {
  let progress = 0;
  for (const key in values) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      const element = values[key];
      if (element !== '') {
        progress += 5;
      }
    }
  }
  return progress;
};
