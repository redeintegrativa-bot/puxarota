-- Consolida regiões duplicadas em formatos canônicos (SP / São Paulo / sao paulo -> "São Paulo, SP")
-- APLICAR SOMENTE APÓS O DEPLOY. Antes de aplicar, rode a prévia abaixo para revisar o impacto:
--
--   select region, count(*) from public.puxarota_profiles
--   where region is not null and btrim(region) <> ''
--   group by region order by count(*) desc;

do $$
declare
  r record;
  canonical text;
begin
  for r in
    select distinct lower(translate(trim(region), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')) as key,
           region as original
    from public.puxarota_profiles
    where region is not null and btrim(region) <> ''
  loop
    canonical := case r.key
      when 'sp' then 'São Paulo, SP'
      when 'sao paulo' then 'São Paulo, SP'
      when 'sao paulo, sp' then 'São Paulo, SP'
      when 'sao paulo sp' then 'São Paulo, SP'
      when 'sao paulo - sp' then 'São Paulo, SP'
      when 'grande sao paulo' then 'Grande São Paulo'
      when 'grande sp' then 'Grande São Paulo'
      when 'campinas' then 'Campinas, SP'
      when 'campinas, sp' then 'Campinas, SP'
      when 'campinas sp' then 'Campinas, SP'
      when 'campinas - sp' then 'Campinas, SP'
      when 'sorocaba' then 'Sorocaba, SP'
      when 'sorocaba, sp' then 'Sorocaba, SP'
      when 'sorocaba sp' then 'Sorocaba, SP'
      when 'sorocaba - sp' then 'Sorocaba, SP'
      when 'rj' then 'Rio de Janeiro, RJ'
      when 'rio de janeiro' then 'Rio de Janeiro, RJ'
      when 'rio de janeiro, rj' then 'Rio de Janeiro, RJ'
      when 'rio de janeiro rj' then 'Rio de Janeiro, RJ'
      when 'mg' then 'Minas Gerais, MG'
      when 'minas gerais' then 'Minas Gerais, MG'
      when 'minas gerais, mg' then 'Minas Gerais, MG'
      when 'minas gerais mg' then 'Minas Gerais, MG'
      when 'pr' then 'Paraná, PR'
      when 'parana' then 'Paraná, PR'
      when 'parana, pr' then 'Paraná, PR'
      when 'parana pr' then 'Paraná, PR'
      when 'rs' then 'Rio Grande do Sul, RS'
      when 'rio grande do sul' then 'Rio Grande do Sul, RS'
      when 'rio grande do sul, rs' then 'Rio Grande do Sul, RS'
      when 'rio grande do sul rs' then 'Rio Grande do Sul, RS'
      when 'sc' then 'Santa Catarina, SC'
      when 'santa catarina' then 'Santa Catarina, SC'
      when 'santa catarina, sc' then 'Santa Catarina, SC'
      when 'santa catarina sc' then 'Santa Catarina, SC'
      when 'ba' then 'Bahia, BA'
      when 'bahia' then 'Bahia, BA'
      when 'bahia, ba' then 'Bahia, BA'
      when 'bahia ba' then 'Bahia, BA'
      when 'df' then 'Brasília, DF'
      when 'brasilia' then 'Brasília, DF'
      when 'brasilia, df' then 'Brasília, DF'
      when 'brasilia df' then 'Brasília, DF'
      when 'pe' then 'Pernambuco, PE'
      when 'pernambuco' then 'Pernambuco, PE'
      when 'pernambuco, pe' then 'Pernambuco, PE'
      when 'pernambuco pe' then 'Pernambuco, PE'
      when 'ce' then 'Ceará, CE'
      when 'ceara' then 'Ceará, CE'
      when 'ceara, ce' then 'Ceará, CE'
      when 'ceara ce' then 'Ceará, CE'
      else null
    end;
    if canonical is not null and canonical is distinct from r.original then
      update public.puxarota_profiles set region = canonical
      where region = r.original;
    end if;
  end loop;
end $$;