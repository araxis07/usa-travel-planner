import photos from '../content/states.json?photos';
import type { Photo, PhotoAsset } from './travel';

const details = photos as Record<string, Photo>;
export const photoDetails = (photo: PhotoAsset | Photo): Photo =>
  'source' in photo ? photo : details[photo.src];
