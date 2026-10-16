// Brand fonts. If brand/tokens.json changes fonts, change these two imports to match.
import {loadFont as loadDisplay} from '@remotion/google-fonts/Poppins';
import {loadFont as loadBody} from '@remotion/google-fonts/Inter';

export const display = loadDisplay('normal', {weights: ['300', '500', '600'], subsets: ['latin']}).fontFamily;
export const body = loadBody('normal', {weights: ['400', '500', '600'], subsets: ['latin']}).fontFamily;
