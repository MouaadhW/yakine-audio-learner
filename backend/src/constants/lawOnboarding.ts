export const LAW_REGIONS = [
  'TUNIS',
  'SOUSSE',
  'SFAX',
  'JENDOUBA',
  'KAIROUAN',
  'GABES',
  'NABEUL',
  'BIZERTE',
] as const;

export const LAW_MAJORS = ['DROIT_PRIVE', 'DROIT_PUBLIC'] as const;
export const LAW_LEVELS = ['L1', 'L2', 'L3'] as const;

export type LawRegion = (typeof LAW_REGIONS)[number];

export const LAW_UNIVERSITIES_BY_REGION: Record<LawRegion, string[]> = {
  TUNIS: [
    'Faculte de Droit et des Sciences Politiques de Tunis (FDSPT)',
    'Faculte des Sciences Juridiques, Politiques et Sociales de Tunis (FSJPST)',
    'Law & Business School (LBS)',
    'Universite Centrale (UC)',
    'Universite Libre de Tunis (ULT)',
    'Mediterranean Institute of Technology (MIT)',
    'Ecole Internationale Superieure Privee de Droit et des Affaires (ISPDA)',
  ],
  SOUSSE: [
    'Faculte de Droit et des Sciences Economiques et Politiques de Sousse (FDSEPS)',
    'IHE Sousse Business & Law School (IHES)',
    'Universite Privee de Sousse (UPS)',
  ],
  SFAX: [
    'Faculte de Droit de Sfax (FDSF)',
    'International Private Business Management University (UIMA)',
    'North-American Private University of Sfax (IIT)',
  ],
  JENDOUBA: [
    'Faculte des Sciences Juridiques, Economiques et de Gestion de Jendouba (FSJEGJ)',
  ],
  KAIROUAN: [
    'Institut Superieur des Etudes Juridiques et Politiques de Kairouan (ISEJPK)',
  ],
  GABES: ['Institut Superieur des Etudes Juridiques de Gabes (ISEJG)'],
  NABEUL: ['Faculte des Sciences Economiques et de Gestion de Nabeul (FSEGN)'],
  BIZERTE: ['Faculte des Sciences Economiques et de Gestion de Bizerte (FSEGB)'],
};
