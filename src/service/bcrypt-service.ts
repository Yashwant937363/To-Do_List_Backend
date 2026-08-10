import bcrypt from "bcrypt";

export const getHash = async (data: string) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(data, salt);
  return hash;
};

export const compareHash = async (hash: string, data: string) => {
  return bcrypt.compare(data, hash);
};
