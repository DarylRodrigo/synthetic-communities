/**
 * Clustering utilities for psychological profiles
 */

import { PCA } from 'ml-pca';
import { kmeans } from 'ml-kmeans';

export function extractPersonalityFeatures(personas) {
  return personas.map(p => {
    const traits = p.personality_traits || {};
    return [
      traits.openness || 0,
      traits.conscientiousness || 0,
      traits.extraversion || 0,
      traits.agreeableness || 0,
      traits.neuroticism || 0,
      p.susceptibility || 0,
      p.trust_institution || 0,
      p.risk_aversion || 0,
      p.confirmation_bias || 0,
      p.social_network_influence || 0
    ];
  });
}

export function performPCA(features, nComponents = 2) {
  try {
    // ml-pca constructor options
    const pca = new PCA(features, { 
      center: true, 
      scale: false 
    });
    
    // Get the transformed data (scores)
    const scores = pca.predict(features, { nComponents });
    
    // ml-pca returns a Matrix object, convert to 2D array
    if (scores && typeof scores === 'object') {
      // If it has a to2DArray method, use it
      if (typeof scores.to2DArray === 'function') {
        return scores.to2DArray();
      }
      // If it's already an array
      if (Array.isArray(scores)) {
        return scores;
      }
    }
    
    return [];
  } catch (error) {
    console.error('PCA error:', error);
    return [];
  }
}

export function performKMeansClustering(features, k = 5) {
  const result = kmeans(features, k, { initialization: 'kmeans++' });
  return result.clusters;
}

export function getClusterStats(personas, clusters) {
  const stats = {};
  
  clusters.forEach((cluster, idx) => {
    if (!stats[cluster]) {
      stats[cluster] = {
        count: 0,
        avgTraits: {
          openness: 0,
          conscientiousness: 0,
          extraversion: 0,
          agreeableness: 0,
          neuroticism: 0
        },
        avgSusceptibility: 0,
        avgTrust: 0,
        ethnicities: {},
        ages: []
      };
    }
    
    const persona = personas[idx];
    const stat = stats[cluster];
    
    stat.count++;
    stat.avgTraits.openness += persona.personality_traits?.openness || 0;
    stat.avgTraits.conscientiousness += persona.personality_traits?.conscientiousness || 0;
    stat.avgTraits.extraversion += persona.personality_traits?.extraversion || 0;
    stat.avgTraits.agreeableness += persona.personality_traits?.agreeableness || 0;
    stat.avgTraits.neuroticism += persona.personality_traits?.neuroticism || 0;
    stat.avgSusceptibility += persona.susceptibility || 0;
    stat.avgTrust += persona.trust_institution || 0;
    stat.ages.push(persona.age);
    
    const eth = persona.ethnicity || 'Unknown';
    stat.ethnicities[eth] = (stat.ethnicities[eth] || 0) + 1;
  });
  
  // Calculate averages
  Object.keys(stats).forEach(cluster => {
    const stat = stats[cluster];
    const count = stat.count;
    
    stat.avgTraits.openness /= count;
    stat.avgTraits.conscientiousness /= count;
    stat.avgTraits.extraversion /= count;
    stat.avgTraits.agreeableness /= count;
    stat.avgTraits.neuroticism /= count;
    stat.avgSusceptibility /= count;
    stat.avgTrust /= count;
    stat.avgAge = stat.ages.reduce((a, b) => a + b, 0) / stat.ages.length;
  });
  
  return stats;
}

