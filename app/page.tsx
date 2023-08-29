import { getAnime } from '@/data/anime';
import Image from 'next/image';
import Recommended from './Recommended';

export default async function Home() {
  let data = await getAnime({ averageScoreGreater: 9, page: 1, perPage: 13 });
  return (
    <main className="w-screen h-screen bg-sky-400">
      <div className="w-screen h-[70vh] p-4">
        <Image
          className="object-cover w-full h-full border-gray-950 border-2"
          src="/images/cover.jpg"
          width={1600}
          height={1300}
          alt="Cover"
        />
      </div>
      <Recommended data={data} />
    </main>
  );
}
