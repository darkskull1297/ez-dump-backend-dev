/* eslint-disable @typescript-eslint/explicit-function-return-type */
// ____ Admin Notifications______//

export const NewOwner = OwnerCompany => {
  return {
    title: `Account created`,
    content: `A new owner account created: ${OwnerCompany}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: '/owners',
  };
};

export const NewContractor = ContractorCompany => {
  return {
    title: `Account created`,
    content: `A new contractor account created: ${ContractorCompany}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: '/contractors',
  };
};

export const NewForeman = (ForemanName, CompanyName) => {
  return {
    title: `Account created`,
    content: `A new foreman account created: ${ForemanName} - ${CompanyName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: '/foremans',
  };
};

export const NewDispatcher = (DispatcherName, CompanyName) => {
  return {
    title: `Account created`,
    content: `A new dispatcher account created: ${DispatcherName} - ${CompanyName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: '/dispatchers',
  };
};

export const NewDriver = () => {
  return {
    title: `Account created`,
    content: `A new driver account created.`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: '/drivers',
  };
};

export const NewJobAvailable = (JobName, ContractorName) => {
  return {
    title: `New job available`,
    content: `Job Name: ${JobName}, contractor name: ${ContractorName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: '/jobs/general/filter/scheduled',
  };
};

export const ProblemReported = (JobName, ReportedBy, Problem) => {
  return {
    title: `Problem Reported`,
    content: `There was a problem at job ${JobName} reported by ${ReportedBy}. The details are: ${Problem}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

export const NewDispute = (disputeNumber, startedBy) => {
  return {
    title: `New dispute started ${disputeNumber} started by ${startedBy}`,
    content: `New dispute`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: '/disputes',
  };
};

export const JobCancelled = (JobName, ContractorName, CancelledBy) => {
  return {
    title: `Job order cancelled`,
    content: `Job name: ${JobName}, contractor: ${ContractorName}, Cancelled By: ${CancelledBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: '/jobs/general/filter/scheduled',
  };
};

export const CashAdvanceApproved = (JobName, invoiceNumber, CancelledBy) => {
  return {
    title: `Cash advance approved`,
    content: `Your cash advance for invoice number ${invoiceNumber} was approved`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: '/invoices/contractor',
  };
};

export const CashAdvanceDenied = invoiceNumber => {
  return {
    title: `Cash advance denied`,
    content: `Your cash advance for invoice number ${invoiceNumber} was denied. 
              for more information contact EZ DUMP TRUCK INC.`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: '/invoices/contractor',
  };
};

export const PaymentReminder = (invoiceNumber, ContractorName) => {
  return {
    title: `Payment Reminder`,
    content: `Payment due soon for invoice number: ${invoiceNumber}, Contractor: ${ContractorName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: '/invoices/contractor',
  };
};

export const JobOrderFinished = (invoiceNumber, ContractorName) => {
  return {
    title: `Job order finished`,
    content: `New invoice is created invoice number: ${invoiceNumber}, Contractor Name: ${ContractorName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: '/invoices/contractor',
  };
};

export const CashAdvangeRequest = invoiceNumber => {
  return {
    title: `Cash advange request`,
    content: `New cash advange requested, invoice number: ${invoiceNumber}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: '/invoices/contractor',
  };
};

// ____ Admin Notifications End______//

// ____To Contractor
export const JobFulfilledContractor = JobName => {
  return {
    title: `Position at job  has been fulfilled`,
    content: `All the positions for job: ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: '/jobs/general/filter/scheduled',
  };
};

// ____To Foreman
export const JobFulfilledForeman = JobName => {
  return {
    title: `Position at job  has been fulfilled`,
    content: `All the positions for job: ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: '/jobs/general/filter/scheduled',
  };
};

// ____To Dispatcher
export const JobFulfilledDispatcher = JobName => {
  return {
    title: `Position at job  has been fulfilled`,
    content: `All the positions for job: ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: '/jobs/general/filter/scheduled',
  };
};

// ____To Owner
export const ClockInOwner = (JobName, DriverName) => {
  return {
    title: `Clock In`,
    content: `Driver ${DriverName} is starting job: ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Owner
export const ClockOutOwner = (JobName, TotalPayBy, DriverName) => {
  return {
    title: `Clock Out`,
    content: `Driver ${DriverName} finished job: ${JobName}, total: ${TotalPayBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};
// ____To Foreman
export const ClockInForeman = (JobName, TruckNumber) => {
  return {
    title: `Clock In`,
    content: `Truck ${TruckNumber} is starting job: ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Foreman
export const ClockOutForeman = (JobName, TruckNumber, TotalPayBy) => {
  return {
    title: `Clock Out`,
    content: `Driver ${TruckNumber} finished job: ${JobName}, total: ${TotalPayBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};
// ____To Dispatcher
export const ClockInDispatcher = (JobName, TruckNumber) => {
  return {
    title: `Clock In`,
    content: `Truck ${TruckNumber} is starting job: ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Dispatcher
export const ClockOutDispatcher = (JobName, TruckNumber, TotalPayBy) => {
  return {
    title: `Clock Out`,
    content: `Driver ${TruckNumber} finished job: ${JobName}, total: $${TotalPayBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};
// ____To Contractor
export const ClockInContractor = (JobName, TruckNumber) => {
  return {
    title: `Clock In`,
    content: `Truck ${TruckNumber} is starting job: ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Contractor
export const ClockOutContractor = (JobName, TotalPayBy, TruckNumber) => {
  return {
    title: `Clock Out`,
    content: `Driver ${TruckNumber} finished job: ${JobName}, total: $${TotalPayBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Owner
export const PaymentReceivedOwner = (InvoiceNumber, PayAmount) => {
  return {
    title: `Ez Dump Truck INC has paid you`,
    content: `You have received a payment for ${InvoiceNumber} of ${PayAmount}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Owner
export const NewJobFromAreaOwner = (ContractorName, LinkJob) => {
  return {
    title: `New job near your area`,
    content: `There is a new job from ${ContractorName} near your area`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: '/jobs/filter/scheduled',
  };
};

export const NewPreferredTruckAssigned = truckNumber => {
  return {
    title: `New job assigned to truck`,
    content: `Truck number: ${truckNumber} has been assigned to a new job, accept or decline this request`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: `/jobs/filter/available`,
  };
};

// ____To Dispatcher
export const ProblemThereJobDispatcher = (
  JobName,
  DispatcherProblemReported,
  ReportBy,
) => {
  return {
    title: `There was a problem`,
    content: `There was a problem at job ${JobName} reported by ${ReportBy}, The details are: ${DispatcherProblemReported}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Foreman
export const ProblemThereJobDForeman = (
  JobName,
  ForemanProblemReported,
  ReportBy,
) => {
  return {
    title: `There was a problem`,
    content: `There was a problem at job ${JobName} reported by ${ReportBy}, The details are: ${ForemanProblemReported}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Foreman
export const ProblemThereJobDContractor = (
  JobName,
  ContractorProblemReported,
  ReportBy,
) => {
  return {
    title: `There was a problem`,
    content: `There was a problem at job ${JobName} reported by ${ReportBy}, The details are: ${ContractorProblemReported}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Owner
export const JobNeverStartedOwner = (DriverName, JobName) => {
  return {
    title: `Job never started`,
    content: `We are sorry to inform that your driver: ${DriverName} never started the job:  ${JobName}. You receive a 0 star review.`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Driver
export const EditScheduleDriver = (DriverNameNew, DriverNameOld, id) => {
  return {
    title: `Hey ${DriverNameOld} The job has been removed`,
    content: `The work has been assigned to ${DriverNameNew}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: id,
  };
};

// ____To Owner
export const RemovedJobAssignationOwner = (
  OwnerName,
  TruckNumber,
  JobName,
  JobOrderNumber,
) => {
  return {
    title: `Hey ${OwnerName}, one of your jobs assignations has been cancelled`,
    content: `We're sorry to inform you that your truck: ${TruckNumber} 
    has been removed from job: ${JobName} - #${JobOrderNumber}, 
    please check for more available jobs or contact EZ DUMP TRUCK Inc., 
    for any inconvenience. Thanks!`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Driver
export const RemovedJobAssignationDriver = (
  DriverName,
  JobName,
  JobOrderNumber,
  id,
) => {
  return {
    title: `Hey ${DriverName}, one of your jobs has been cancelled`,
    content: `We're sorry to inform you that job: ${JobName} 
    - Order Number #${JobOrderNumber} has been cancelled, 
    please contact your boss for more info. Thanks!`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: id,
  };
};

// ____To Owner
export const NewDisputeOwner = (ReportedBy, InvoiceNumber) => {
  return {
    title: `New dispute was started`,
    content: `There was a problem with the invoice number: ${InvoiceNumber} reported by: ${ReportedBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

// ____To Contractor
export const NewDisputeContractor = (ReportedBy, InvoiceNumber) => {
  return {
    title: `New dispute was started`,
    content: `There was a problem with the invoice number: ${InvoiceNumber} reported by: ${ReportedBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

// ____To Contractor
export const RechargedContractor = (Amount, InvoiceNumber) => {
  return {
    title: `Late fee added`,
    content: `We are sorry to inform that we never received the payment for this invoice #: ${InvoiceNumber}. 
              So a ${Amount} (4%) was added to the amount to be paid. 
              A new recharge will be added in 1 week. 
              please feel free to contact us at hello@ezdumptruck.com or call (919) 946 8860`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

// ____To Owner
export const SolvedDisputeOwner = (Resolution, InvoiceNumber) => {
  return {
    title: `Dispute solved`,
    content: `A dispute on invoice #: ${InvoiceNumber} was solved with the next resolution: ${Resolution}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Contractor
export const SolvedDisputeContractor = (Resolution, InvoiceNumber) => {
  return {
    title: `Dispute solved`,
    content: `A dispute on invoice #: ${InvoiceNumber} was solved with the next resolution: ${Resolution}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Contractor
export const JobCancelContractor = (JobName, CancelledBy) => {
  return {
    title: `Job cancel`,
    content: `We are sorry to inform you that the job: ${JobName} was cancelled by: ${CancelledBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

// ____To Owner
export const JobCancelOwner = (JobName, CancelledBy) => {
  return {
    title: `Job cancel`,
    content: `We are sorry to inform you that the job: ${JobName} was cancelled by: ${CancelledBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

// ____To Foreman
export const JobCancelForeman = (JobName, CancelledBy) => {
  return {
    title: `Job cancel`,
    content: `We are sorry to inform you that the job: ${JobName} was cancelled by: ${CancelledBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

// ____To Dispatcher
export const JobCancelDispatcher = (JobName, CancelledBy) => {
  return {
    title: `Job cancel`,
    content: `We are sorry to inform you that the job: ${JobName} was cancelled by: ${CancelledBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

// ____To Driver
export const JobCancelDriver = (JobName, CancelledBy) => {
  return {
    title: `Job cancel`,
    content: `We are sorry to inform you that the job: ${JobName} was cancelled by: ${CancelledBy}`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

// ____To Contractor
export const JobNotFullfilledContractor = JobName => {
  return {
    title: `The job is not fullfilled yet`,
    content: `The job ${JobName} is not fullfilled yet`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Dispatcher
export const JobNotFullfilledDispatcher = JobName => {
  return {
    title: `The job is not fullfilled yet`,
    content: `The job ${JobName} is not fullfilled yet`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Foreman
export const JobNotFullfilledForeman = JobName => {
  return {
    title: `The job is not fullfilled yet`,
    content: `The job ${JobName} is not fullfilled yet`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Owner
export const AutomaticallyClockOutOwner = DriverName => {
  return {
    title: `Automatically clock out`,
    content: `Your driver ${DriverName} was automatically clock out, you need to provide the evidence necessary`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

// ____To Owner
export const cashAdvanceApprovedOwner = InvoiceNumber => {
  return {
    title: `Cash advance approved `,
    content: `Your cash advance for invoice number ${InvoiceNumber} was approved`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Owner
export const cashAdvanceDeniedOwner = InvoiceNumber => {
  return {
    title: `Cash advance denied `,
    content: `Your cash advance for invoice number ${InvoiceNumber} was denied.`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Contractor
export const PaymentReminderContractor = (InvoiceNumber, DueDate) => {
  return {
    title: `Payment reminder`,
    content: `This is just a reminder thatt you have a pending payment. 
             invoice number ${InvoiceNumber} you have until ${DueDate} to make payment, 
             if you dont pay it, you will be charge a 4% late fee.`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Owner
export const TruckReviewOwner = (NumberStars, JobName, TruckNumber) => {
  return {
    title: `Truck review`,
    content: `truck number ${TruckNumber} received ${NumberStars} review and comments for the job ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ____To Contractor
export const NewTruckAssignedContractor = (JobName, TruckNumber) => {
  return {
    title: `New truck assigned `,
    content: `Truck number ${TruckNumber} was assigned to job ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Dispatcher
export const NewTruckAssignedDispatcher = (JobName, TruckNumber) => {
  return {
    title: `New truck assigned `,
    content: `Truck number ${TruckNumber} was assigned to job ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Owner
export const NewTruckAssignedOwner = (JobName, TruckNumber) => {
  return {
    title: `New truck assigned `,
    content: `Truck number ${TruckNumber} was assigned to job ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Contractor
export const ScheduleJobFinishedContractor = (
  JobName,
  OrderNumber,
  PayBy,
  DueDate,
) => {
  return {
    title: `Scheduled shift finished.`,
    content: `job name: ${JobName}
                order number: ${OrderNumber}
                total pay by: ${PayBy}
                payment due date: ${DueDate}
                remenber that you need to pay before ${DueDate} or you will get a 4% late fee.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Contractor
export const shiftOrderFullfilledContractor = JobName => {
  return {
    title: `Shift order fullfilled.`,
    content: `All positions for the job ${JobName} have been fulfilled.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Foreman
export const shiftOrderFullfilledForeman = JobName => {
  return {
    title: `Shift order fullfilled.`,
    content: `All positions for the job ${JobName} have been fulfilled.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Dispatcher
export const shiftOrderFullfilledDispatcher = JobName => {
  return {
    title: `Shift order fullfilled.`,
    content: `All positions for the job ${JobName} have been fulfilled.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Owner
export const notifyDriverInsideClockIn = (JobName, UserName) => {
  return {
    title: `WARNING!!!`,
    content: `Driver ${UserName} has just entered clock in radius for job ${JobName}`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Driver
export const CancelActiveJob = (jobName, orderNumber, user) => {
  return {
    title: `Clock Out`,
    content: `Job: ${jobName} - Order Number: ${orderNumber}\n You have been clocked out by ${user}, please add the evidence and data necessary to complete the job. If you have any inconvenience, please add at the comments.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

export const RequestedTruck = (generalJobId, jobName) => {
  return {
    title: `Requested Truck`,
    content: `Truck Requested in ${jobName}.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: `/jobs/general/${generalJobId}/filter/requestedTrucks`,
  };
};

export const NotClockIn = DriverName => {
  return {
    title: `WARNING!!!`,
    content: `Dear ${DriverName}
    now you are able to do clock in, don't forget it.
    BE SAFE.`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

export const EnteredJobRadius = DriverName => {
  return {
    title: `WARNING!!!`,
    content: `Dear driver ${DriverName}, you just entered clock in radius. Start clocking in! let us know if something is wrong at 919 946-8860 EZ DUMP TRUCK INC`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

export const LeavedJobRadius = DriverName => {
  return {
    title: `WARNING!`,
    content: `Hey ${DriverName}, you forgot to clock in, please come back to the load site to clock in, or let us know if something is wrong. Please contact us at EZ DUMP TRUCK 919 946-8860`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

export const DriverLeavedJobRadius = (DriverName, OwnerName) => {
  return {
    title: `WARNING!!!`,
    content: `Hey ${OwnerName}, your driver ${DriverName} forgot to clock in!! Please try to contact him to find out what is going on and let us know if you need some help, we are here for you. EZ DUMP TRUCK INC 919 946-8860`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

export const OwnerAsseguranza = (days, type, title) => {
  const daysAux = days > 0 ? days : days * -1;
  if (type === 1) {
    return {
      title: `Your insurance ${title} is overdue.`,
      content: `days past due ${daysAux}`,
      submitted: new Date(),
      isChecked: false,
      priority: 1,
      link: 'false',
    };
  }
  return {
    title: `Your insurance ${title} is about to expire.`,
    content: `days to expire ${daysAux}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};
export const AdminAsseguranza = (owner, days, type, title) => {
  const daysAux = days > 0 ? days : days * -1;
  if (type === 1) {
    return {
      title: `${owner}, has expired insurance ${title}.`,
      content: `days past due ${daysAux}`,
      submitted: new Date(),
      isChecked: false,
      priority: 1,
      link: 'false',
    };
  }
  return {
    title: `${owner}, insurance ${title} will expire.`,
    content: `days to expire ${daysAux}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

export const DriverLeavedRadiusContractor = (
  OwnerName,
  DriverName,
  ContractorName,
) => {
  return {
    title: `WARNING!!!`,
    content: `Dear ${ContractorName}, the driver ${DriverName} from ${OwnerName} forgot to clock in!!, please try to contact him to find out what is going on.
    Let us know if everything is okay.`,
    submitted: new Date(),
    isChecked: false,
    priority: 1,
    link: 'false',
  };
};

export const JobHoldedDriver = (user, jobName, orderNumber) => {
  return {
    title: 'WARNING',
    content: `Dear ${user}, the job ${jobName} - ${orderNumber} has been put on hold, please be aware of any update. Sorry for the inconvenience. If you have any question feel free to contact us at any time. EZ DUMP TRUCK INC.`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

export const JobResumedDriver = (user, jobName, orderNumber) => {
  return {
    title: 'WARNING',
    content: `Dear ${user}, the job ${jobName} - ${orderNumber} now is ready to start`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

export const JobHoldedOwner = (user, jobName) => {
  return {
    title: 'WARNING',
    content: `Dear ${user}, the job ${jobName} has been put on hold, please be aware of any update. Sorry for the inconvenience. If you have any question feel free to contact us at any time. EZ DUMP TRUCK INC.`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

export const JobResumedOwner = (user, jobName) => {
  return {
    title: 'WARNING',
    content: `Dear ${user}, the job ${jobName} now is ready to start`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

export const CanceledPreferredTruck = (user, truck, job) => {
  return {
    title: 'WARNING',
    content: `Dear ${user}, the preferred truck ${truck} required for the job ${job.name} order ${job.orderNumber} has been canceled by the Hauler!\n but don't worry, your job now is visible for more trucks at the platform.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ____To Owner
export const TaskOrderOnDue = (OwnerName, TaskOrderNumber, TruckNumber) => {
  return {
    title: `Hey ${OwnerName}, one of your task orders is now due`,
    content: `Task Order: #${TaskOrderNumber} for Truck: ${TruckNumber} 
    is due, check it out as soon as possible!`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// ___to Admin
export const NewContractorManualPayment = (
  orderNumber: number,
  contractorName: string,
) => {
  return {
    title: 'New manual payment',
    content: `${contractorName} paid manually the invoice with order: ${orderNumber}.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ___to Owner
export const NewAdminManualPayment = (orderNumber: number) => {
  return {
    title: 'New manual payment',
    content: `You've received a payment for the invoice with order: ${orderNumber}.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// ___to Contractor
export const PaymentApprovedByAdmin = (orderNumber: number) => {
  return {
    title: 'Payment approved',
    content: `Dear contractor, your payment of the invoice with order: ${orderNumber} was approved.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};

// __to Admin
export const DisputeStartedNotification = (
  role: string,
  company: string,
  invoiceNumber: string,
) => {
  return {
    title: 'Dispute started',
    content: `${role} ${company} has created a new dispute for invoice ${invoiceNumber}`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
    link: 'false',
  };
};

// __to Owner and Contractor
export const DisputedAcceptedNotification = (
  role: string,
  company: string,
  invoiceNumber: string,
) => {
  return {
    title: 'Dispute accepted',
    content: `Dear ${role} ${company} the dispute for invoice ${invoiceNumber} has been accepted`,
    submitted: new Date(),
    isChecked: false,
    priority: 2,
  };
};
// ___to Contractor
export const PaymentRejectedByAdmin = (orderNumber: number) => {
  return {
    title: 'Payment rejected',
    content: `Dear contractor, your payment of the invoice with order: ${orderNumber} was rejected.`,
    submitted: new Date(),
    isChecked: false,
    priority: 3,
    link: 'false',
  };
};
