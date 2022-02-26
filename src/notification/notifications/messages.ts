/* eslint-disable @typescript-eslint/explicit-function-return-type */
// ___to driver
export const NewJobAsignedDriver = (
  startTime,
  LoadSite,
  finishTime,
  truckAsigned,
  material,
  payBy,
  dumpSite,
  jobName,
  DriverName,
) => {
  return {
    body: `Dear ${DriverName},\nYou have been assigned to the job ${jobName}.\nPlease attend to: ${LoadSite} at ${startTime}.\nFinish time: ${finishTime}.\nTruck assigned: ${truckAsigned}.\nMaterial: ${material}.\nPay By: ${payBy}.\nDump site: ${dumpSite}.`,
  };
};

// ___to Contractor
export const NewContractorMessage = name => {
  return {
    body: `Account created,\nA new contractor account created: ${name}`,
  };
};
// ___to Hauler
export const NewHaulerMessage = name => {
  return {
    body: `Account created,\nA new owner account created: ${name}`,
  };
};
// ___to Dispatcher
export const NewDispatcherMessage = name => {
  return {
    body: `Account created,\nA new dispatcher account created: ${name}`,
  };
};
// ___to Driver
export const NewDriverMessage = name => {
  return {
    body: `Account created,\nA new driver account created: ${name}`,
  };
};

export const ForgotPasswordMessage = link => {
  return {
    body: `Follow the next link in order to reset your password:\n\n ${link}`,
  };
};
// ___to Foreman
export const NewForemanMessage = name => {
  return {
    body: `Account created,\nA new foreman account created: ${name}`,
  };
};
// ___to Admin
export const NewdisputesMessage = (disputeNumber, startDispute) => {
  return {
    body: `New dispute started,\n ${disputeNumber} started by ${startDispute}`,
  };
};
// ___to Admin
export const NewJobAvailableAdmin = (JobName, ContractorName) => {
  return {
    body: `New job available,\n Job name: ${JobName}\n contractor name: ${ContractorName}`,
  };
};
// ___to Admin
export const ReportProblem = (JobName, ReportedBy, Problem) => {
  return {
    body: `There was a problem at job ${JobName}\n reported by ${ReportedBy}.\n The details are: ${Problem}`,
  };
};

// ___to Hauler
export const NewJobNearAreaOwner = LinkJob => {
  return {
    body: `Dear Hauler, There is a new job available for you in your area,\n check it out now ${LinkJob}.`,
  };
};

// ___to Hauler
export const JobCancelOwner = (JobName, CancelBy) => {
  return {
    body: `Dear Hauler,\nWe are sorry to inform you that the job: ${JobName}\nWas cancelled by: ${CancelBy}.`,
  };
};

// ___to Contractor
export const JobCancelContractor = (JobName, CancelBy) => {
  return {
    body: `Dear contractor,\nWe are sorry to inform you that the job: ${JobName}\nWas cancelled by: ${CancelBy}.`,
  };
};

// ___to foreman
export const JobCancelForeman = (JobName, CancelBy) => {
  return {
    body: `Dear foreman,\nWe are sorry to inform you that the job: ${JobName}\nWas cancelled by: ${CancelBy}.`,
  };
};

// ___to dispatcher
export const JobCancelDispatcher = (JobName, CancelBy) => {
  return {
    body: `Dear dispatcher,\nWe are sorry to inform you that the job: ${JobName}\nWas cancelled by: ${CancelBy}.`,
  };
};

// ___to driver
export const JobCancelDriver = (JobName, CancelBy) => {
  return {
    body: `Dear driver,\nWe are sorry to inform you that the job: ${JobName}\nWas cancelled by: ${CancelBy}.`,
  };
};

// ___to driver
export const DriverNewAccount = (email, password, phoneNumber) => {
  return {
    body: `Hey driver, nice to have you on board!\n Combine your skills with the EZ DUMP TRUCK APP features to improve your performance and get things done!!!\n We'll do everything we can help and support you as you need it...\n To make it official, log in at EZ DRIVER APP with:\nusername: ${
      email && email !== '' ? `${email} or ${phoneNumber}` : phoneNumber
    }\ntemporaly password: ${password} \n\n Follow the next links to download the app based in your device: \n\nIOS: https://apps.apple.com/us/app/ez-drivers/id1537247152\n\nAndroid: https://play.google.com/store/apps/details?id=uy.spacedev.ezdumpdrivers`,
  };
};

// ___to driver
export const ClockInReminder = driverName => {
  return {
    body: `Dear ${driverName},\ndon't forget to do clock in!\nYou can do clock in NOW!`,
  };
};

// ___to driver
export const AutomaticallyClockOutDriver = () => {
  return {
    body: `Dear driver,\nYour were automatically clock out, you need to provide the evidence necessary.`,
  };
};

// ___to Hauler
export const AutomaticallyClockOutOwner = driverName => {
  return {
    body: `Dear Hauler,\nYour driver ${driverName} was automatically clock out, you need to provide the evidence necessary.`,
  };
};

// ___to Hauler
export const CashAdvanceapprovedOwner = InvoiceNumber => {
  return {
    body: `Dear Hauler,\nYour cash advance for invoice number ${InvoiceNumber} was approved.`,
  };
};

// ___to Hauler
export const CashAdvanceDeniedOwner = InvoiceNumber => {
  return {
    body: `Dear Hauler,\nYour cash advance for invoice number ${InvoiceNumber} was denied\nFor more information contact EZ DUMP TRUCK inc.`,
  };
};

// ___to contractor
export const PaymentReminderContractor = () => {
  return {
    body: `Dear Hauler,\nThis is just a reminder that you have a pending payment.`,
  };
};

export const PreferredTruckAssigned = truckNumber => {
  return {
    body: `Dear Hauler,\nTruck number: ${truckNumber} has been assigned to a new job, accept or decline this request`,
  };
};

// ___to Admin
export const NewContractorManualPayment = (
  orderNumber: number,
  contractorName: string,
) => {
  return {
    body: `New manual payment, \n${contractorName} paid manually the invoice with order: ${orderNumber}.`,
  };
};

// ___to Owner
export const NewAdminManualPayment = (orderNumber: number) => {
  return {
    body: `New payment\nYou've received a payment for the invoice with order: ${orderNumber}.`,
  };
};

// ___to Contractor
export const PaymentApprovedByAdmin = (orderNumber: number) => {
  return {
    body: `Dear contractor,\nyour payment of the invoice with order: ${orderNumber} was approved.`,
  };
};

// __to Admin
export const DisputeStarted = (
  role: string,
  company: string,
  invoiceNumber: string,
) => {
  return {
    body: `${role} ${company} has created a new dispute for invoice ${invoiceNumber}`,
  };
};

// __to Owner and Contractor
export const DisputeAccepted = (
  role: string,
  company: string,
  invoiceNumber: string,
) => {
  return {
    body: `Dear ${role} ${company} the dispute for invoice ${invoiceNumber} has been accepted`,
  };
};
// ___to Contractor
export const PaymentRejectedByAdmin = (orderNumber: number) => {
  return {
    body: `Dear contractor,\nyour payment of the invoice with order: ${orderNumber} was rejected.`,
  };
};
