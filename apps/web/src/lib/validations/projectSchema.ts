export interface ProjectBriefInput {
    title: string;
    description: string;
    category: string;
    budgetMin: number;
    budgetMax: number;
    deadline?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Validates buyer custom commission project briefs before creation.
 */
export function validateProjectBrief(input: Partial<ProjectBriefInput>): ValidationResult {
    const errors: Record<string, string> = {};

    if (!input.title || input.title.trim().length < 3) {
        errors.title = 'Project title must be at least 3 characters.';
    }

    if (!input.description || input.description.trim().length < 10) {
        errors.description = 'Project description must be at least 10 characters.';
    }

    if (!input.category || input.category.trim().length === 0) {
        errors.category = 'Craft category is required.';
    }

    const min = Number(input.budgetMin) || 0;
    const max = Number(input.budgetMax) || 0;

    if (min <= 0) {
        errors.budgetMin = 'Minimum budget must be greater than zero.';
    }

    if (max < min) {
        errors.budgetMax = 'Maximum budget must be greater than or equal to minimum budget.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
