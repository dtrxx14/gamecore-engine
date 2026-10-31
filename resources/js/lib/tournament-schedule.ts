type ScheduleParticipant = {
    name: string;
};

type ScheduleMatch = {
    match_label: string;
    participants: ScheduleParticipant[];
};

type ScheduleRound = {
    label: string;
    slots: ScheduleMatch[];
};

type SchedulePool = {
    matches: ScheduleMatch[];
};

type ScheduleEliminationTree =
    | ScheduleRound[]
    | {
          winners?: ScheduleRound[];
          losers?: ScheduleRound[];
          grand_final?: ScheduleRound;
      };

type ScheduleStage = {
    stage_index: number;
    label: string;
    competition_format: string;
    pools: SchedulePool[];
    elimination_tree: ScheduleEliminationTree;
};

type ScheduleGroup = {
    stageIndex: number;
    stage: string;
    round: string;
    matches: ScheduleMatch[];
    durationMinutes: number;
};

type ScheduleCategory = {
    id: number;
    name: string;
    formats: { game_time?: number | null }[];
    bracket_stages: ScheduleStage[];
};

type ScheduleTournament = {
    start_date?: string | null;
    settings: {
        start_time_in_hours: string;
        end_time_in_hours: string;
        default_match_duration_minutes: number;
        default_rest_time_minutes: number;
        default_court_counts: number;
    };
};

export type ScheduleItem = {
    id: string;
    categoryId: number;
    category: string;
    stageIndex: number;
    stage: string;
    round: string;
    label: string;
    participants: string[];
    court: number;
    start: Date;
    end: Date;
    durationMinutes: number;
};

type CategoryScheduleState = {
    category: ScheduleCategory;
    groups: ScheduleGroup[];
    gateGroupIndex: number;
    groupIndex: number;
    pendingMatchIndexes: number[];
    roundReadyAt: Date;
    roundFinish: Date;
    active: boolean;
};

const CATEGORY_CHANGEOVER_MINUTES = 30;

const parseTime = (value: string, base: Date, fallbackMinutes: number): Date => {
    const match = value.match(/^(\d{1,2}):(\d{2})/);
    const result = new Date(base);
    const hours = match ? Number(match[1]) : Math.floor(fallbackMinutes / 60);
    const minutes = match ? Number(match[2]) : fallbackMinutes % 60;
    result.setHours(hours, minutes, 0, 0);

    return result;
};

const getBaseDate = (value?: string | null): Date => {
    const dateMatch = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dateMatch) {
        return new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]));
    }

    const date = value ? new Date(value) : new Date();
    date.setHours(0, 0, 0, 0);

    return date;
};

const buildPreliminaryRounds = (stage: ScheduleStage): ScheduleRound[] => {
    const seenPairs = new Set<string>();
    const pendingMatches = stage.pools.flatMap((pool) => pool.matches).filter((match) => {
        const pair = match.participants.map((participant) => participant.name).sort().join('|');

        if (seenPairs.has(pair)) {
            return false;
        }

        seenPairs.add(pair);

        return true;
    });
    const rounds: ScheduleRound[] = [];

    while (pendingMatches.length > 0) {
        const usedTeams = new Set<string>();
        const roundMatches: ScheduleMatch[] = [];

        for (let index = pendingMatches.length - 1; index >= 0; index -= 1) {
            const match = pendingMatches[index];
            const teams = match.participants.map((participant) => participant.name);

            if (teams.some((team) => usedTeams.has(team))) {
                continue;
            }

            roundMatches.unshift(match);
            teams.forEach((team) => usedTeams.add(team));
            pendingMatches.splice(index, 1);
        }

        if (roundMatches.length === 0) {
            const nextMatch = pendingMatches.shift();

            if (nextMatch) {
                roundMatches.push(nextMatch);
            }
        }

        rounds.push({
            label: `Preliminary Round ${rounds.length + 1}`,
            slots: roundMatches,
        });
    }

    return rounds;
};

const getStageRounds = (stage: ScheduleStage): ScheduleRound[][] => {
    if (stage.competition_format === 'round-robin') {
        const eliminationRounds = Array.isArray(stage.elimination_tree) ? stage.elimination_tree : [];
        const preliminaryRounds = buildPreliminaryRounds(stage);

        return [...preliminaryRounds, ...eliminationRounds].map((round) => [round]);
    }

    if (stage.competition_format === 'double-elimination' && !Array.isArray(stage.elimination_tree)) {
        const tree = stage.elimination_tree;
        const winnersRounds = tree.winners ?? [];
        const losersRounds = tree.losers ?? [];
        const rounds: ScheduleRound[][] = [];

        for (let roundIndex = 0; roundIndex < Math.max(winnersRounds.length, losersRounds.length + 1); roundIndex += 1) {
            const roundGroup = [
                ...(winnersRounds[roundIndex] ? [winnersRounds[roundIndex]] : []),
                ...(roundIndex > 0 && losersRounds[roundIndex - 1] ? [losersRounds[roundIndex - 1]] : []),
            ];

            if (roundGroup.length > 0) {
                rounds.push(roundGroup);
            }
        }

        if (tree.grand_final) {
            rounds.push([tree.grand_final]);
        }

        return rounds;
    }

    const rounds = Array.isArray(stage.elimination_tree) ? stage.elimination_tree : [];

    return rounds.map((round) => [round]);
};

const maxDate = (first: Date, second: Date): Date => (first > second ? first : second);

const getNextDayOpeningTime = (value: Date, openingMinutes: number): Date => {
    const nextDayOpening = new Date(value);
    nextDayOpening.setHours(0, 0, 0, 0);
    nextDayOpening.setDate(nextDayOpening.getDate() + 1);
    nextDayOpening.setMinutes(openingMinutes);

    return nextDayOpening;
};

const isAfterDailyClosing = (
    value: Date,
    openingMinutes: number,
    closingMinutes: number,
): boolean => {
    const closingTime = new Date(value);
    closingTime.setHours(0, 0, 0, 0);
    closingTime.setMinutes(closingMinutes);

    if (closingMinutes <= openingMinutes) {
        closingTime.setDate(closingTime.getDate() + 1);
    }

    return value > closingTime;
};

const getCategoryGateGroupIndex = (groups: ScheduleGroup[]): number => {
    const quarterFinalsIndex = groups.findIndex((group) => /quarter[\s-]*final/i.test(group.round));

    if (quarterFinalsIndex >= 0) {
        return quarterFinalsIndex;
    }

    const semiFinalsIndex = groups.findIndex((group) => /semi[\s-]*final/i.test(group.round));

    if (semiFinalsIndex >= 0) {
        return semiFinalsIndex;
    }

    const finalIndex = groups.findIndex((group) => /\bfinal\b|championship/i.test(group.round));

    return finalIndex >= 0 ? finalIndex : Math.max(0, groups.length - 1);
};

const getNextMatchStart = (
    earliest: Date,
    durationMinutes: number,
    openingMinutes: number,
    closingMinutes: number,
    allowAfterClosing: boolean,
): Date => {
    const dayStart = new Date(earliest);
    dayStart.setHours(0, 0, 0, 0);
    const opensAt = new Date(dayStart);
    opensAt.setMinutes(openingMinutes);
    const closesAt = new Date(dayStart);
    closesAt.setMinutes(closingMinutes);

    if (closingMinutes <= openingMinutes) {
        closesAt.setDate(closesAt.getDate() + 1);
    }

    let candidate = earliest < opensAt ? opensAt : earliest;

    if (allowAfterClosing) {
        return candidate;
    }

    if (candidate >= closesAt) {
        opensAt.setDate(opensAt.getDate() + 1);
        candidate = opensAt;
    }

    const dailyWindowMinutes = (closesAt.getTime() - opensAt.getTime()) / 60_000;

    if (durationMinutes <= dailyWindowMinutes && candidate.getTime() + durationMinutes * 60_000 > closesAt.getTime()) {
        opensAt.setDate(opensAt.getDate() + 1);
        candidate = opensAt;
    }

    return candidate;
};

export const buildTournamentSchedule = (
    categories: ScheduleCategory[],
    tournament: ScheduleTournament,
): ScheduleItem[] => {
    const categoriesToFinishBeforeAdvancing = new Set<number>();
    const baseDate = getBaseDate(tournament.start_date);
    const openingTime = parseTime(tournament.settings.start_time_in_hours, baseDate, 9 * 60);
    const closingTime = parseTime(tournament.settings.end_time_in_hours, baseDate, 22 * 60);
    const openingMinutes = openingTime.getHours() * 60 + openingTime.getMinutes();
    const closingMinutes = closingTime.getHours() * 60 + closingTime.getMinutes();
    let schedule: ScheduleItem[] = [];

    while (true) {
        schedule = buildSchedule(categories, tournament, categoriesToFinishBeforeAdvancing);
        let addedCategoryToFinish = false;

        categories.forEach((category) => {
            if (categoriesToFinishBeforeAdvancing.has(category.id)) {
                return;
            }

            const categorySchedule = schedule.filter((item) => item.categoryId === category.id);
            const categoryFinish = categorySchedule.reduce<Date | undefined>(
                (latest, item) => !latest || item.end > latest ? item.end : latest,
                undefined,
            );
            const groups = category.bracket_stages.flatMap((stage, stageIndex) => {
                const format = category.formats[stageIndex] ?? category.formats[category.formats.length - 1];
                const durationMinutes = Math.max(1, format?.game_time ?? tournament.settings.default_match_duration_minutes);

                return getStageRounds(stage).map((roundGroup) => ({
                    stageIndex,
                    stage: stage.label,
                    round: roundGroup.map((round) => round.label).join(' / '),
                    matches: roundGroup.flatMap((round) => round.slots),
                    durationMinutes,
                }));
            }).filter((group) => group.matches.length > 0);
            const gateGroup = groups[getCategoryGateGroupIndex(groups)];
            const nextGroup = groups[getCategoryGateGroupIndex(groups) + 1];
            const gateMatches = gateGroup
                ? categorySchedule.filter((item) => item.stageIndex === gateGroup.stageIndex && item.round === gateGroup.round)
                : [];
            const gateFinish = gateMatches.reduce<Date | undefined>(
                (latest, item) => !latest || item.end > latest ? item.end : latest,
                undefined,
            );
            const nextGroupStart = nextGroup
                ? categorySchedule
                    .filter((item) => item.stageIndex === nextGroup.stageIndex && item.round === nextGroup.round)
                    .reduce<Date | undefined>(
                        (earliest, item) => !earliest || item.start < earliest ? item.start : earliest,
                        undefined,
                    )
                : undefined;

            if (
                gateMatches.length > 0
                && categoryFinish
                && (
                    !isSameCalendarDay(gateMatches[0].start, categoryFinish)
                    || (gateFinish && isAfterDailyClosing(gateFinish, openingMinutes, closingMinutes))
                    || (
                        gateFinish
                        && nextGroupStart
                        && (
                            !isSameCalendarDay(gateFinish, nextGroupStart)
                            || isAfterDailyClosing(nextGroupStart, openingMinutes, closingMinutes)
                        )
                    )
                )
            ) {
                categoriesToFinishBeforeAdvancing.add(category.id);
                addedCategoryToFinish = true;
            }
        });

        if (!addedCategoryToFinish) {
            return schedule;
        }
    }
};

const isSameCalendarDay = (first: Date, second: Date): boolean =>
    first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();

const buildSchedule = (
    categories: ScheduleCategory[],
    tournament: ScheduleTournament,
    categoriesToFinishBeforeAdvancing: Set<number>,
): ScheduleItem[] => {
    const settings = tournament.settings;
    const baseDate = getBaseDate(tournament.start_date);
    const startTime = parseTime(settings.start_time_in_hours, baseDate, 9 * 60);
    const openingMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endTime = parseTime(settings.end_time_in_hours, baseDate, 22 * 60);
    const closingMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const courts = Math.max(1, settings.default_court_counts || 1);
    const restMinutes = Math.max(0, settings.default_rest_time_minutes || 0);
    const courtAvailable = Array.from({ length: courts }, () => new Date(startTime));
    const participantAvailable = new Map<string, Date>();
    const schedules: ScheduleItem[] = [];

    const states: CategoryScheduleState[] = categories.map((category) => {
        const groups = category.bracket_stages.flatMap((stage, stageIndex) => {
            const format = category.formats[stageIndex] ?? category.formats[category.formats.length - 1];
            const durationMinutes = Math.max(1, format?.game_time ?? settings.default_match_duration_minutes);

            return getStageRounds(stage).map((roundGroup) => ({
                stageIndex,
                stage: stage.label,
                round: roundGroup.map((round) => round.label).join(' / '),
                matches: roundGroup.flatMap((round) => round.slots),
                durationMinutes,
            }));
        }).filter((group) => group.matches.length > 0);

        return {
            category,
            groups,
            gateGroupIndex: getCategoryGateGroupIndex(groups),
            groupIndex: 0,
            pendingMatchIndexes: groups[0]?.matches.map((_, index) => index) ?? [],
            roundReadyAt: new Date(startTime),
            roundFinish: new Date(startTime),
            active: false,
        };
    }).filter((state) => state.groups.length > 0);

    states.forEach((state, index) => {
        state.active = index === 0;
    });

    while (states.some((state) => state.active && state.groupIndex < state.groups.length)) {
        states.forEach((state, stateIndex) => {
            while (state.active && state.groupIndex < state.groups.length && state.pendingMatchIndexes.length === 0) {
                state.roundReadyAt = new Date(state.roundFinish.getTime() + restMinutes * 60_000);
                state.groupIndex += 1;
                state.roundFinish = new Date(state.roundReadyAt);
                state.pendingMatchIndexes = state.groups[state.groupIndex]?.matches.map((_, index) => index) ?? [];
            }

            if (
                state.active
                && (categoriesToFinishBeforeAdvancing.has(state.category.id)
                    ? state.groupIndex >= state.groups.length
                    : state.groupIndex === state.gateGroupIndex)
                && stateIndex + 1 < states.length
                && !states[stateIndex + 1].active
            ) {
                const nextCategory = states[stateIndex + 1];
                nextCategory.active = true;
                nextCategory.roundReadyAt = categoriesToFinishBeforeAdvancing.has(state.category.id)
                    ? getNextDayOpeningTime(state.roundFinish, openingMinutes)
                    : new Date(state.roundReadyAt.getTime() + CATEGORY_CHANGEOVER_MINUTES * 60_000);
                nextCategory.roundFinish = new Date(nextCategory.roundReadyAt);
            }
        });

        const candidates: {
            state: CategoryScheduleState;
            matchIndex: number;
            courtIndex: number;
            start: Date;
        }[] = [];

        states.forEach((state) => {
            const group = state.active ? state.groups[state.groupIndex] : undefined;

            if (!group || state.pendingMatchIndexes.length === 0) {
                return;
            }

            state.pendingMatchIndexes.forEach((matchIndex) => {
                const match = group.matches[matchIndex];
                const participantKeys = match.participants
                    .map((participant) => `${state.category.id}:${participant.name}`)
                    .filter((name) => name.length > 0);
                const participantReadyAt = participantKeys.reduce(
                    (readyAt, participant) => maxDate(readyAt, participantAvailable.get(participant) ?? readyAt),
                    state.roundReadyAt,
                );

                courtAvailable.forEach((courtReadyAt, courtIndex) => {
                    candidates.push({
                        state,
                        matchIndex,
                        courtIndex,
                        start: getNextMatchStart(
                            maxDate(participantReadyAt, courtReadyAt),
                            group.durationMinutes,
                            openingMinutes,
                            closingMinutes,
                            state.groupIndex >= state.gateGroupIndex,
                        ),
                    });
                });
            });
        });

        candidates.sort(
            (first, second) =>
                first.start.getTime() - second.start.getTime()
                || states.indexOf(first.state) - states.indexOf(second.state)
                || first.courtIndex - second.courtIndex
                || first.matchIndex - second.matchIndex,
        );
        const selected = candidates[0];

        if (!selected) {
            break;
        }

        const state = selected.state;
        const group = state.groups[state.groupIndex];
        const match = group.matches[selected.matchIndex];
        const end = new Date(selected.start.getTime() + group.durationMinutes * 60_000);
        const courtReadyAt = new Date(end.getTime() + restMinutes * 60_000);
        const participantNames = match.participants.map((participant) => participant.name);

        courtAvailable[selected.courtIndex] = courtReadyAt;
        participantNames.forEach((name) => {
            participantAvailable.set(`${state.category.id}:${name}`, courtReadyAt);
        });
        state.roundFinish = maxDate(state.roundFinish, end);
        state.pendingMatchIndexes.splice(state.pendingMatchIndexes.indexOf(selected.matchIndex), 1);
        schedules.push({
            id: `${state.category.id}-${group.stageIndex}-${state.groupIndex}-${selected.matchIndex}`,
            categoryId: state.category.id,
            category: state.category.name,
            stageIndex: group.stageIndex,
            stage: group.stage,
            round: group.round,
            label: match.match_label,
            participants: participantNames,
            court: selected.courtIndex + 1,
            start: selected.start,
            end,
            durationMinutes: group.durationMinutes,
        });
    }

    return schedules.sort(
        (first, second) =>
            first.start.getTime() - second.start.getTime()
            || first.court - second.court
            || first.categoryId - second.categoryId,
    );
};
