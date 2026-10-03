export type RealEstateHome5Link = {
  label: string;
  href: string;
};

export type RealEstateHome5Stat = {
  value: string;
  label: string;
};

export type RealEstateHome5Service = {
  id?: string;
  title: string;
  image: string;
};

export type RealEstateHome5Step = {
  title: string;
  desc: string;
};

export type RealEstateHome5Project = {
  title?: string;
  image: string;
  tab?: string;
};

export type RealEstateHome5Testimonial = {
  name: string;
  role?: string;
  content?: string;
  quote?: string;
  image?: string;
};

export type RealEstateHome5Blog = {
  id?: string;
  title: string;
  image: string;
  date?: string;
  author?: string;
  excerpt?: string;
  href?: string;
};
