import "server-only";
import type { AppLanguage } from "@/lib/i18n";
import { healthCheckQuestions } from "@/lib/health-check/questions";
import { readyToRentQuestions } from "@/lib/ready-to-rent/questions";

export type AssessmentType = "health_check" | "ready_to_rent";
export type DisplayQuestion = { key: string; category: string; text: string; options: { value: string; label: string; score: number }[] };
export type ContentRow = { assessment_type: AssessmentType; question_key: string; category_en: string; category_zh: string; question_en: string; question_zh: string; option_labels_en: string[]; option_labels_zh: string[] };

const healthZh = [
  ["沟通", "您如何评价目前物业经理与您的沟通？", "主动、清晰且及时|通常清晰，偶有延迟|沟通不稳定或经常延迟|沟通很差或难以取得联系"],
  ["定期检查", "您对物业定期检查的频率、质量和后续跟进满意吗？", "按时检查并有详细跟进|总体稳定且有帮助|检查不定期或细节不足|很少检查或没有跟进"],
  ["租金欠款管理", "发生租金欠款时，监控、沟通和处理的效率如何？", "每日监控并迅速处理|通常能快速发现并处理|通知或行动有时延迟|缺乏透明度或有效跟进"],
  ["维修处理", "您如何评价维修申请、安排及沟通？", "及时、协调良好且有记录|大多数维修处理得当|存在延误或沟通断层|维修经常未解决"],
  ["续租管理", "续租是否能在关键日期前得到规划、讨论并完成？", "提前讨论并按时完成|通常在到期前完成|经常临近到期才处理|错过期限或无人管理"],
  ["合规管理", "您对相关物业合规义务得到监控和管理有多大信心？", "记录完整并主动管理|总体管理到位且记录最新|部分义务或记录不清楚|没有主动管理合规"],
  ["业主报告", "您收到的物业报告是否实用、准确且及时？", "详细准确并按时提供|有帮助，偶有遗漏|细节有限或经常延迟|报告不准确或无法获得"],
  ["市场租金评估", "您对物业市场租金评估的时间和质量满意吗？", "定期提供有数据支持的建议|按适当周期评估|评估不频繁或依据不足|没有提供有意义的评估"],
  ["费用透明度", "管理费、收费和账单是否清晰透明？", "所有费用清晰且可核对|大体清楚，仅有少量疑问|多项收费需要说明|费用或账单不清楚"],
  ["整体管理信心", "总体而言，您对投资物业目前的管理有多大信心？", "完全有信心|总体有信心|仍有一些重要疑虑|几乎或完全没有信心"],
];
const readyZh = [
  ["安全与合规", "物业的基本安全和合规要求是否已更新并适合新租约？", "全部合规且有完整记录|只剩一项小检查或更新|仍有多项要求未完成|尚未评估相关要求"],
  ["烟雾报警器", "烟雾报警器是否已安装、合规、测试并可在租约开始日正常使用？", "合规、已测试并有记录|已安装，仅需小型保养|需要测试或升级|缺失、故障或尚未评估"],
  ["电气安全", "电气装置、开关、插座及配套设备是否安全正常？", "检查项目均安全正常|一项小问题需要处理|多处需要维修或检查|存在已知危险或重大故障"],
  ["管道与用水", "水龙头、厕所、排水和热水系统是否正常且无明显漏水或故障？", "全部正常且无明显漏水|仍有轻微滴漏或调整|多处需要维修|存在严重漏水或系统故障"],
  ["门锁与安保", "外门、窗户、门锁和安保设备是否正常并提供适当安全保障？", "所有出入口均可正常上锁|仍有一项小调整或钥匙问题|多处门锁或窗户需维修|物业无法得到充分锁闭"],
  ["清洁状况", "物业是否已全面清洁并可向潜在租客展示？", "专业清洁完成，可立即展示|只需少量收尾清洁|仍需进行大规模清洁|尚未清洁或不适合展示"],
  ["维修与保养", "已知维修、损坏及保养事项是否已达到适当标准？", "所有已知事项均已完成|只剩少量外观工作|仍有多项维修未完成|仍有重大损坏或紧急工程"],
  ["设施与电器", "包含的设施、电器、照明和通风系统是否清洁并正常运作？", "所有项目均清洁且正常|仍有一项小保养或更换|多项需要维修或清洁|必要设施或电器无法使用"],
  ["庭院与通道", "花园、户外区域、道路、楼梯和物业通道是否整洁、安全且适合展示？", "整洁安全，可立即展示|只需少量园艺或整理|需要保养或安全工程|通道或户外区域不安全"],
  ["资料准备", "钥匙、说明书、合规记录及其他租赁资料是否整理齐全？", "所有钥匙和资料均已整理|只缺一份小文件或钥匙|缺少多份记录或钥匙|尚未准备交接资料"],
];

export function fallbackRows(type: AssessmentType): ContentRow[] {
  const questions = type === "health_check" ? healthCheckQuestions : readyToRentQuestions;
  const zh = type === "health_check" ? healthZh : readyZh;
  return questions.map((question, index) => ({ assessment_type: type, question_key: question.key, category_en: question.category, category_zh: zh[index][0], question_en: question.text, question_zh: zh[index][1], option_labels_en: question.options.map((option) => option.label), option_labels_zh: zh[index][2].split("|") }));
}

export function mergeQuestions(type: AssessmentType, language: AppLanguage, rows: ContentRow[] = []): DisplayQuestion[] {
  const base = type === "health_check" ? healthCheckQuestions : readyToRentQuestions;
  const defaults = fallbackRows(type);
  return base.map((question, index) => {
    const row = rows.find((item) => item.question_key === question.key) ?? defaults[index];
    const labels = language === "zh" ? row.option_labels_zh : row.option_labels_en;
    return { key: question.key, category: language === "zh" ? row.category_zh : row.category_en, text: language === "zh" ? row.question_zh : row.question_en, options: question.options.map((option, optionIndex) => ({ ...option, label: labels[optionIndex] || option.label })) };
  });
}
