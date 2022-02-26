export const dataProfile = object => {
  const { insuranceNeeded, companyCommon, contacts } = object.company;
  const { name, email, profileImg, phoneNumber } = object;

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
    userInfo: {
      name,
      email,
      profileImg,
      phoneNumber,
    },
  };
};
