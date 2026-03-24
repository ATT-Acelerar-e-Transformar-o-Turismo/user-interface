import React from 'react';
import DomainCard from '../DomainCard';
import { useDomain } from '../../contexts/DomainContext';

export default function DimensionsSection() {
  const { domains, loading, error } = useDomain();

  return (
    <div className="relative w-full py-32">
      <div className="max-w-[1512px] mx-auto px-12">
        <div className="text-center mb-24" data-aos="fade-down">
            <h2 className="font-['Onest'] font-semibold text-[48px] text-[#0a0a0a] mb-4">
            Conheça os Números do nosso Turismo
            </h2>
            <p className="font-['Onest'] font-medium text-[24px] text-[#0a0a0a] opacity-80">
            Escolha uma dimensão para entender como o território se está a transformar.
            </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-600">
            <p>Erro ao carregar domínios: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-wrap justify-center gap-8 lg:gap-[120px]">
            {domains.map((domain, index) => (
              <DomainCard
                key={domain.id}
                title={domain.name}
                color={domain.DomainColor}
                indicators={domain.subdomains?.map(sub => sub.name) || []}
                icon={domain.DomainIcon}
                shadowColor={domain.DomainColor}
                page={`/indicators/${domain.name.toLowerCase()}`}
                data-aos="fade-up"
                data-aos-delay={100 + (index * 150)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
