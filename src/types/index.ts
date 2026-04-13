export type NewsItem = {
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: Date;
};

export type ChannelType = "RSS" | "NEWSAPI";

export type NewsletterStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";
