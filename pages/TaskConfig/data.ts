import z, { string, number, object } from "zod";

const ValveSchema = number().min(0).max(23);

export const FormSchema = object({


    name: string().max(24),
    date: string().refine(str => str.match(/(\d{4}-\d{2}-\d{2})/) || str == "", {
        message: "Date doesn't match the required form at: yyyy-mm-dd",
    }),
    time: string().refine(str => str.match(/\d{1,2}:\d{1,2}/), {
        message: "Time doesn't match the required format: hh:mm (24hr)",
    }),
    depth: number().min(0),
    pumps: string()
        .nonempty()
        .refine(
            s => s.split(",").every(n => n.split("-").every(n => !isNaN(Number(n)) || n == "-")),
            {
                message: "Input contains non-numeric character or doesn't follow the format",
            }
        )
        .refine(
            s =>
                s
                    .split(",")
                    .every(n => n.split("-").every(n => ValveSchema.safeParse(Number(n)).success)),
            {
                message: "Valve number must be >= 0 and <= 23",
            }
        )
        .refine(
            s =>
                Array.from(s.matchAll(/(\d*-\d*)/g)).every(m =>
                    RegExp(/(\d+-\d+)/g).test(m.toString())
                ),
            {
                message: "Range missing bound",
            }
        )
        .refine(
            s =>
                Array.from(s.matchAll(/(\d+-\d+)/g)).every(
                    m =>
                        Number([...m.toString().matchAll(/(\d+(?=-))-(\d+)/g)][0][1]) <
                        Number([...m.toString().matchAll(/(\d+(?=-))-(\d+)/g)][0][2])
                ),
            {
                message: "Larger bound is first",
            }
        ),
    timeBetween: number().min(0),
    notes: string().optional(),
    sampleTime: number().min(0),
    preserveDrawTime: number().min(0),
    preserveTime: number().min(0),
}).refine(s => s.date != "" || s.depth != 0, {
    message: "needs to either be executed by time or depth",
    path: ["depth"]
});

export type FormValues = z.infer<typeof FormSchema>;

export type FieldProps = {
    name: keyof FormValues;
    label: string;
    type?: "string" | "number" | "date" | "time" | "button";
    sublabel?: string;
    helperText?: string;
};

export const generalFields: FieldProps[] = [
    { name: "name", label: "Task Name", sublabel: "Name unique to this task" },
    {
        name: "date",
        type: "date",
        label: "Schedule Date (Optional)",
        sublabel: "Date when to execute this task",
        helperText: "Format: mm/dd/yyyy, clear to not execute on time",
    },
    {
        name: "time",
        type: "time",
        label: "Schedule Time",
        sublabel: "Time of the day to execute this task",
        helperText: "Format: hh:mm (pm|am)",
    },
    {
        name: "depth",
        type: "number",
        label: "Depth (Optional)",
        sublabel: "depth to execute this task",
        helperText: "meters, 0 to not execute on depth"
    },
    {
        name: "notes",
        label: "Notes",
        sublabel: "Optional note to remember this task",
    },
];

export const valveFields: FieldProps[] = [
    {
        name: "pumps",
        label: "Pumps",
        sublabel: "Pumps asigned to this task",
        helperText: "Comma-separated pump numbers & ranges: eg. 1,3-8,21",
    },
    {
        name: "timeBetween",
        label: "Time Between",
        sublabel: "Time until next pump",
        type: "number",
        helperText: "Unit: second",
    },
];

export const sampleFields: FieldProps[] = [
    { name: "sampleTime", type: "number", label: "Sample Time", helperText: "Unit: second" },
];

export const preserveFields: FieldProps[] = [
    { name: "preserveTime", type: "number", label: "Preserve Time", helperText: "Unit: second" },
    { name: "preserveDrawTime", type: "number", label: "Preserve Draw Time", helperText: "Unit: second" },
];

export type ConfigSectionName = "general" | "pumps" | "sample" | "preserve";
export const configFields: Record<ConfigSectionName, { title: string; fields: FieldProps[] }> = {
    general: { title: "General", fields: generalFields },
    pumps: { title: "Pumps", fields: valveFields },
    sample: { title: "Sample", fields: sampleFields },
    preserve: { title: "Preserve", fields: preserveFields },
};
