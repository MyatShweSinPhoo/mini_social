export function getProfileImageSrc(image: string | null | undefined): string {
  if (!image) {
    return "/profile/profile.jpg";
  }

  if (/^(https?:|data:|blob:)/i.test(image) || image.startsWith("/")) {
    return image;
  }

  return `/profile/${image}`;
}
