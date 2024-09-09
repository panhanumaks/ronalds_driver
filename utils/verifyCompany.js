import companyList from "../company-list.json" assert { type: "json" };

export const isCompanyVerified = (companyName) => {
  return companyList.some(
    (company) => company.toLowerCase() === companyName?.toLowerCase()
  );
};
