import invert from 'invert-color';
import z from 'zod';

const responseSchema = z.object({
  data: z.object({
    Page: z.object({
      pageInfo: z.object({
        total: z.number(),
        currentPage: z.number(),
        lastPage: z.number(),
        hasNextPage: z.boolean(),
        perPage: z.number(),
      }),
      media: z.array(
        z.object({
          id: z.number(),
          title: z.object({ romaji: z.string() }),
          type: z.string(),
          coverImage: z.object({
            extraLarge: z.string(),
            large: z.string(),
            medium: z.string(),
            color: z.string().nullable(),
          }),
        })
      ),
    }),
  }),
});

// https://anilist.github.io/ApiV2-GraphQL-Docs/
const QUERY = `
query ($id: Int, $page: Int, $perPage: Int, $search: String, $averageScoreGreater: Int, $seasonYear: Int) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (id: $id, search: $search, averageScore_greater: $averageScoreGreater, type: ANIME, seasonYear: $seasonYear, sort: [SCORE_DESC]) {
      id
      type
      title {
        romaji
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
    }
  }
}
`;

const URL = 'https://graphql.anilist.co';

const START_YEAR = new Date().getFullYear();

export interface GetAnimeInput {
  averageScoreGreater?: number;
  page: number;
  perPage: number;
}
export type GetAnimeResponse = Array<{
  id: number;
  title: string;
  cover: string;
  color: string;
  invertedColor: string;
}>;
export async function getAnime(
  props: GetAnimeInput
): Promise<GetAnimeResponse> {
  let response = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        ...props,
        seasonYear: START_YEAR,
      },
    }),
  });
  if (!response.ok) {
    throw new Error('API(anilist) request has failed');
  }

  let json = await response.json();
  let validationResult = responseSchema.safeParse(json);
  if (!validationResult.success) {
    throw new Error('API(anilist) responded with bad data');
  }
  return validationResult.data.data.Page.media.map((anime) => {
    let color = anime.coverImage.color ?? 'black';
    return {
      id: anime.id,
      title: anime.title.romaji,
      cover: anime.coverImage.extraLarge,
      color: anime.coverImage.color ?? 'black',
      invertedColor: invert(color, { black: '#0a0a0a', white: '#fafafa' }),
    };
  });
}
