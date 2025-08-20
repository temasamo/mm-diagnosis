export default function Page(){
    return (
      <main className="max-w-[720px] mx-auto my-10">
        <h2 className="text-xl font-semibold">最終診断結果</h2>
        <section className="mt-4">
          <h3 className="font-semibold">第一候補グループ</h3>
          <ul className="list-disc ml-6"><li>商品A（ダミー）</li><li>商品B（ダミー）</li></ul>
        </section>
        <section className="mt-4">
          <h3 className="font-semibold">第二候補グループ</h3>
          <ul className="list-disc ml-6"><li>商品C（ダミー）</li></ul>
        </section>
        <p className="opacity-70 mt-4">※ここに「診断理由」「悩みの要約」を表示します。</p>
      </main>
    );
  }
  