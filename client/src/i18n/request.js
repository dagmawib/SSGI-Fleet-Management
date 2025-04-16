import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();

  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value || "am";

  return {
    locale: cookieLocale,
    messages: (await import(`../../messages/${cookieLocale}.json`)).default,
  };
});
