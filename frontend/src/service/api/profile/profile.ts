import { queryOptions, useSuspenseInfiniteQuery } from '@tanstack/react-query'

import { AUTHORIZATION_API, BACKEND_API } from '@/service/config'
import {
  DeleteProfileImageRequest,
  GetProfilePagingRequest,
  GetUserProfileRequest,
  ProfilePagingProps,
  ProfilePagingResponse,
  UpdateProfileImageRequest,
  UpdateProfileRequest,
  Users,
} from '@/service/model'
import { Role, SemesterCode } from '@/types'

export const getProfilePaging = async ({
  page = '0',
  size = 24,
  roles = ['ROLE_ADMIN', 'ROLE_MEMBER', 'ROLE_TEAM_LEADER'],
  joinSemester,
}: GetProfilePagingRequest): Promise<ProfilePagingResponse> => {
  const userClient = new Users(BACKEND_API)
  const response = await userClient.getProfiles({
    page: Number(page),
    size,
    roles,
    joinSemester: joinSemester as SemesterCode,
  })
  const { data } = response

  return {
    profiles: data.content,
    nextPageToken:
      data.pageable.pageNumber !== data.totalPages
        ? (data.pageable.pageNumber + 1).toString()
        : undefined,
    pageInfo: {
      totalPages: data.totalPages,
      totalElements: data.totalElements,
      pageSize: data.pageable.pageSize,
    },
  }
}

const getUserProfile = async ({ userId }: GetUserProfileRequest) => {
  const userClient = new Users(AUTHORIZATION_API)
  const response = await userClient.getProfile(userId)

  return response.data
}

export const profileQuries = {
  all: () => ['profile'],
  lists: ({
    roles,
    joinSemester,
  }: {
    roles: Role[]
    joinSemester?: string
  }) => [...profileQuries.all(), 'lists', ...roles, joinSemester],
  profiles: ({ userId }: GetUserProfileRequest) => [
    ...profileQuries.all(),
    userId,
  ],
  profile: ({ userId }: GetUserProfileRequest) =>
    queryOptions({
      queryKey: [...profileQuries.profiles({ userId })],
      enabled: !!userId,
      queryFn: async () => getUserProfile({ userId }),
    }),
}

export const useProfileSuspensePaging = ({
  size = 24,
  initPageToken,
  roles,
  joinSemester,
}: ProfilePagingProps) => {
  return useSuspenseInfiniteQuery({
    queryKey: [...profileQuries.lists({ roles, joinSemester }), initPageToken],
    queryFn: ({ pageParam = initPageToken }) =>
      getProfilePaging({ page: pageParam, size, roles, joinSemester }),
    initialPageParam: initPageToken,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
  })
}

export const updateProfileInfoApi = async ({
  userId,
  data,
}: UpdateProfileRequest) => {
  const userClient = new Users(AUTHORIZATION_API)
  const response = await userClient.updateProfile(userId, data)

  return response.data
}

export const updateProfileImageApi = async ({
  userId,
  data,
}: UpdateProfileImageRequest) => {
  const userClient = new Users(AUTHORIZATION_API)
  const response = await userClient.updateProfileImage(userId, data)

  return response.data
}

export const deleteProfileImageApi = async ({
  userId,
}: DeleteProfileImageRequest) => {
  const userClient = new Users(AUTHORIZATION_API)
  const response = await userClient.deleteProfileImage(userId)

  return response.data
}
