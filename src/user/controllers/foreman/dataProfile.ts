export const dataProfile: any = object => {
  const { insuranceNeeded, companyCommon, contacts } = object;
  return {
    insuranceNeeded,
    companyInfo: {
      name: companyCommon.name,
      EINNumber: companyCommon.EINNumber,
      fax: companyCommon.fax,
      officePhoneNumber: companyCommon.officePhoneNumber,
      address: companyCommon.address,
    },
    contacts,
  };
};
