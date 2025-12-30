import Head from "next/head";

export default function LivePage() {
  return (
    <>
      <Head>
        <title>Shoowflix Live</title>
      </Head>
      <iframe
        src="https://live.shoowflix.com"
        title="Shoowflix Live"
        className="fixed inset-0 w-full h-full bg-black border-0"
        allowFullScreen
      />
    </>
  );
}
